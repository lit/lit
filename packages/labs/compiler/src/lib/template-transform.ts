/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {_$LH as litHtmlPrivate} from 'lit-html/private-ssr-support.js';
import {parseFragment, serialize} from 'parse5';
import {
  addPartConstructorImport,
  AttributePartConstructorAliases,
  createCompiledTemplate,
  createCompiledTemplateResult,
  createSecurityBrandTagFunction,
  createTemplateParts,
  PartType,
  TemplatePart,
} from './ast-fragments.js';
import {
  isCommentNode,
  isElementNode,
  isTextNode,
  traverse,
  getTextContent,
} from '@parse5/tools';
import {getTypeChecker} from './type-checker.js';
const {getTemplateHtml, markerMatch, marker, boundAttributeSuffix} =
  litHtmlPrivate;

/**
 * Fail type checking if the first argument is not `never` and return the
 * argument.
 */
export function unreachable(x: never) {
  return x;
}

interface TemplateInfo {
  /**
   * The top level statement in module scope containing the `node`
   * TaggedTemplateExpression as a child within it. This provides a module
   * scoped top level statement that we can generate the `CompiledTemplate`
   * directly before.
   *
   * For example given:
   *
   * ```ts
   * function () {
   *  html`hi`;
   * }
   * ```
   *
   * The created `TemplateInfo` data will contain the `function` node as the
   * `topStatement`, the `html` tagged template expression in `node`, and a
   * unique identifier in `variableName`.
   */
  topStatement: ts.Statement;
  node: ts.TaggedTemplateExpression;
  /**
   * The generated unique identifier to represent this template. The generated
   * `CompiledTemplate` is assigned to this `variableName`, and the generated
   * `CompiledTemplateResult` references this `variableName`.
   */
  variableName: ts.Identifier;
}

/**
 * Matches the raw text elements.
 *
 * Comments are not parsed within raw text elements, so we need to search their
 * text content for marker strings.
 */
const rawTextElement = /^(?:script|style|textarea|title)$/i;

/**
 * Certain elements do not support dynamic bindings within their innerHTML.
 *
 * Reference: https://lit.dev/docs/templates/expressions/#invalid-locations
 */
const elementDoesNotSupportInnerHtmlExpressions = new Set([
  'template',
  'textarea',
]);

/**
 * CompiledTemplatePass provides a `ts.TransformerFactory` that transforms
 * `html` tagged templates into a `CompiledTemplateResult`.
 *
 * Usage:
 *
 * ```ts
 * const compileLitTemplates = CompiledTemplatePass.getTransformer()
 * // Then use somewhere a transformer is accepted. E.g.,
 * // `transformers: {before: [compileLitTemplates()]}`
 * ```
 */
class CompiledTemplatePass {
  static getTransformer(): ts.TransformerFactory<ts.SourceFile> {
    return (
      context: ts.TransformationContext
    ): ts.Transformer<ts.SourceFile> => {
      return (sourceFile: ts.SourceFile): ts.SourceFile => {
        const pass = new CompiledTemplatePass(context, sourceFile);
        pass.findTemplates(sourceFile);
        if (pass.expressionToTemplate.size === 0) {
          // No templates to compile.
          return sourceFile;
        }
        const transformedSourceFile = pass.rewriteTemplates(sourceFile);
        if (!ts.isSourceFile(transformedSourceFile)) {
          throw new Error(
            `Internal Error: Expected source file to be transformed into another source file.`
          );
        }
        // Add part constructors import if required.
        if (
          pass.addedSecurityBrandVariableStatement !== null &&
          Object.keys(pass.attributePartConstructorNames).length > 0
        ) {
          return addPartConstructorImport({
            factory: context.factory,
            sourceFile: transformedSourceFile,
            securityBrand: pass.addedSecurityBrandVariableStatement,
            attributePartConstructorNameMap: pass.attributePartConstructorNames,
          });
        }
        return transformedSourceFile;
      };
    };
  }

  /**
   * Map top level statements to templates marked for compilation.
   */
  private readonly topLevelStatementToTemplate = new Map<
    ts.Statement,
    TemplateInfo[]
  >();
  /**
   * Map an `html` tagged template expression to the template info for each
   * template to compile. If a template is not in this map, it will not be
   * rewritten into a `CompiledTemplateResult`.
   */
  private readonly expressionToTemplate = new Map<
    ts.TaggedTemplateExpression,
    TemplateInfo
  >();
  /**
   * Track the added security brand AST node so we only add one.
   */
  addedSecurityBrandVariableStatement: ts.Statement | null = null;
  /**
   * The unique identifier for each attribute part constructor. These are added
   * while template preparation is done, and signal which parts need to be
   * imported. If all keys are undefined, then no parts will be added to the
   * compiled file.
   */
  private readonly attributePartConstructorNames: AttributePartConstructorAliases =
    {};
  /**
   * Unique security brand identifier. Used as the tag function for the prepared
   * HTML.
   */
  private readonly securityBrandIdent: ts.Identifier;
  /**
   * Type checker which can be used to query if a tagged template expression is
   * a lit template.
   */
  private readonly checker: ReturnType<typeof getTypeChecker>;
  private constructor(
    private readonly context: ts.TransformationContext,
    sourceFile: ts.SourceFile
  ) {
    this.securityBrandIdent = context.factory.createUniqueName('b');
    this.checker = getTypeChecker(sourceFile.fileName, sourceFile.text);
  }

  /**
   * Find all Lit templates.
   *
   * Walks all children in the sourceFile and populates state on the class
   * instance used to rewrite the templates.
   */
  private findTemplates(sourceFile: ts.SourceFile) {
    // Store the stack of open ancestor nodes from sourceFile to the current
    // node so that we can quickly get the top-level statement containing a
    // template.
    const nodeStack: Array<ts.Node> = [];

    const findTemplates = <T extends ts.Node>(node: T) => {
      return ts.visitNode(node, (node: ts.Node): ts.Node => {
        nodeStack.push(node);
        if (
          ts.isTaggedTemplateExpression(node) &&
          this.checker.isLitTaggedTemplateExpression(node)
        ) {
          const topStatement = nodeStack[1] as ts.Statement;
          const templateInfo = {
            topStatement,
            node,
            variableName: ts.factory.createUniqueName('lit_template'),
          };
          const templates =
            this.topLevelStatementToTemplate.get(topStatement) ?? [];
          templates.push(templateInfo);
          this.topLevelStatementToTemplate.set(topStatement, templates);
          this.expressionToTemplate.set(node, templateInfo);
        }
        const result = ts.visitEachChild(node, findTemplates, this.context);
        nodeStack.pop();
        return result;
      });
    };

    return findTemplates(sourceFile);
  }

  /**
   * Perform an inorder traversal starting at the passed in `node`, calling
   * `this.rewriteTemplates` on each node traversed.
   *
   * Has two behaviors:
   *  1. If the traversal matches a top level statement containing
   *     TemplateResults, add a top-level `CompiledTemplate`.
   *  2. If the traversal encounters an `html` tagged template to compile,
   *     replace it with a `CompiledTemplateResult`.
   */
  private rewriteTemplates<T extends ts.Node>(node: T): ts.Node {
    const rewriteTemplates = (node: ts.Node): ts.VisitResult<ts.Node> => {
      // Insert a top-level pre-compiled definition of a template.
      if (this.topLevelStatementToTemplate.has(node as ts.Statement)) {
        return this.addTopLevelCompiledTemplate(node);
      }

      // Maybe rewrite the template expression to use a CompiledTemplateResult.
      node = this.rewriteTemplateResultToCompiledTemplateResult(node);
      return ts.visitEachChild(node, rewriteTemplates, this.context);
    };

    const rewrittenNode = ts.visitNode(node, rewriteTemplates);
    if (!rewrittenNode) {
      throw new Error(`Internal Error: Unexpected undefined 'rewrittenNode'.`);
    }
    return rewrittenNode;
  }

  /**
   * This code is identical to the logic that occurs when preparing a lit-html
   * `Template` (the internal class in lit-html.ts). It has been modified to use
   * parse5 instead of the browser but otherwise is very similar.
   *
   * Because the prepared HTML will contribute to file size, markers have been
   * stripped out, and comment nodes always use the 3 byte `<?>` format.
   */
  private litHtmlPrepareRenderPhase(templateExpression: ts.TemplateLiteral):
    | {
        shouldCompile: false;
      }
    | {shouldCompile: true; preparedHtml: string; parts: TemplatePart[]} {
    if (templateContainsOctalEscapes(templateExpression)) {
      return {shouldCompile: false};
    }

    const parts: Array<TemplatePart> = [];

    // Get the static strings from the source code, turn them into a spoofed
    // template strings array, and pass them into `getTemplateHtml` for the
    // prepared HTML.
    const spoofedTemplate = ts.isNoSubstitutionTemplateLiteral(
      templateExpression
    )
      ? ([templateExpression.text] as unknown as TemplateStringsArray)
      : ([
          templateExpression.head.text,
          ...templateExpression.templateSpans.map((s) => s.literal.text),
        ] as unknown as TemplateStringsArray);
    // lit-html enforces at runtime that `getTemplateHtml` only accepts a
    // TemplateStringsResult.
    (spoofedTemplate as unknown as {raw: string}).raw = '';
    let html: TrustedHTML | string = '';
    let attrNames: Array<string | undefined> = [];
    try {
      [html, attrNames] = getTemplateHtml(spoofedTemplate, 1);
    } catch {
      return {shouldCompile: false};
    }
    const ast = parseFragment(html as unknown as string, {
      sourceCodeLocationInfo: false,
    });

    // Start at -1 to account for an extra root document fragment.
    let nodeIndex = -1;
    let attrNameIndex = 0;
    let shouldCompile = true;
    traverse(ast, {
      'pre:node': (node): boolean | void => {
        if (isElementNode(node)) {
          const attributesToRemove = new Set<unknown>();
          if (node.tagName.includes(marker)) {
            // Do not compile template if a marker was inserted in tag name
            // position.
            // TODO(ajakubowicz): Provide a diagnostic here.
            shouldCompile = false;
            return false;
          }
          if (
            elementDoesNotSupportInnerHtmlExpressions.has(node.tagName) &&
            serialize(node).includes(marker)
          ) {
            // TODO(ajakubowicz): Provide a diagnostic here.
            shouldCompile = false;
            return false;
          }
          if (node.attrs.length > 0) {
            for (const attr of node.attrs) {
              if (
                attr.name.endsWith(boundAttributeSuffix) ||
                attr.name.startsWith(marker)
              ) {
                attributesToRemove.add(attr);
                const realName = attrNames[attrNameIndex++];
                if (realName !== undefined) {
                  const statics = attr.value.split(marker);
                  // We store the case-sensitive name from `attrNames` (generated
                  // while parsing the template strings); note that this assumes
                  // parse5 attribute ordering matches string ordering
                  const [, prefix, caseSensitiveName] = /([.?@])?(.*)/.exec(
                    realName
                  )!;
                  parts.push({
                    type: PartType.ATTRIBUTE,
                    index: nodeIndex,
                    name: caseSensitiveName,
                    strings: statics,
                    ctorType:
                      prefix === '.'
                        ? PartType.PROPERTY
                        : prefix === '?'
                        ? PartType.BOOLEAN_ATTRIBUTE
                        : prefix === '@'
                        ? PartType.EVENT
                        : PartType.ATTRIBUTE,
                  });
                } else {
                  parts.push({
                    type: PartType.ELEMENT,
                    index: nodeIndex,
                  });
                }
              }
            }
            node.attrs = node.attrs.filter(
              (attr) => !attributesToRemove.has(attr)
            );
          }
          if (rawTextElement.test(node.tagName)) {
            // Raw text elements treat their contents as raw text. E.g.,
            // `<textarea><!--Hi--></textarea>` will render a textarea element
            // with the comment as visible contents. Currently the compiled
            // template runtime doesn't handle raw text elements with bindings,
            // so we do not optimize these templates.
            const hasMarkers = getTextContent(node).includes(marker);
            if (hasMarkers) {
              shouldCompile = false;
              return false;
            }
          }
        } else if (isCommentNode(node)) {
          if (node.data === markerMatch) {
            parts.push({
              type: PartType.CHILD,
              index: nodeIndex,
            });
          } else {
            // Handle a dynamic binding within a comment node, e.g.:
            // html`<!--<div>${'binding'}</div>--><p>${'hi'}</p>`
            let i = -1;
            while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
              // Comment node has a binding marker inside, make an inactive part
              // The binding won't work, but subsequent bindings will
              parts.push({type: PartType.COMMENT_PART, index: nodeIndex});
              // Move to the end of the match
              i += marker.length - 1;
            }
            // In the compiled result, remove the markers, so compiled files are
            // deterministic.
            node.data = node.data.replaceAll(marker, '');
          }
        } else if (isTextNode(node)) {
          // Do not count text nodes.
          nodeIndex--;
        }
        nodeIndex++;
      },
    });

    if (!shouldCompile) {
      return {shouldCompile: false};
    }

    // Add required unique ctor identifiers for parts added.
    const f = this.context.factory;
    for (const part of parts) {
      if (part.type === PartType.ATTRIBUTE) {
        const ctorType = part.ctorType;
        switch (ctorType) {
          case PartType.ATTRIBUTE: {
            this.attributePartConstructorNames.AttributePart ??=
              f.createUniqueName('A');
            break;
          }
          case PartType.BOOLEAN_ATTRIBUTE: {
            this.attributePartConstructorNames.BooleanAttributePart ??=
              f.createUniqueName('B');
            break;
          }
          case PartType.EVENT: {
            this.attributePartConstructorNames.EventPart ??=
              f.createUniqueName('E');
            break;
          }
          case PartType.PROPERTY: {
            this.attributePartConstructorNames.PropertyPart ??=
              f.createUniqueName('P');
            break;
          }
          default: {
            throw new Error(
              `Internal Error: Unexpected attribute type: ${unreachable(
                ctorType
              )}`
            );
          }
        }
      }
    }

    // Any comments containing a lit marker can be simplified to reduce file
    // size. E.g., `<!--?lit$1234$-->` is replaced with `<?>`.
    const preparedHtml = serialize(ast).replace(
      new RegExp(`<!--\\?${marker.replace(/\$/g, '\\$')}-->`, 'g'),
      '<?>'
    );

    return {
      shouldCompile: true,
      preparedHtml,
      parts,
    };
  }

  /**
   * Add a CompiledTemplate to the top level statement scope. This method
   * prepares the TemplateResult into a CompiledTemplate, creating prepared HTML
   * and a template parts array.
   */
  private addTopLevelCompiledTemplate(node: ts.Node): ts.Statement[] {
    if (!this.topLevelStatementToTemplate.has(node as ts.Statement)) {
      throw new Error(
        `Internal Error: Invalid usage of 'addTopLevelCompiledTemplate'. ` +
          `'this.topLevelStatementToTemplate' must contain 'node'.`
      );
    }

    const f = this.context.factory;
    const topLevelTemplates: ts.VariableStatement[] = [];
    // For each Lit template, prepare a CompiledTemplate.
    for (const template of this.topLevelStatementToTemplate.get(
      node as ts.Statement
    )!) {
      const result = this.litHtmlPrepareRenderPhase(template.node.template);
      if (!result.shouldCompile) {
        this.expressionToTemplate.delete(template.node);
        continue;
      }
      const {parts: partData, preparedHtml} = result;
      const parts = createTemplateParts({
        f,
        parts: partData,
        attributePartConstructorNameMap: this.attributePartConstructorNames,
      });

      topLevelTemplates.push(
        createCompiledTemplate({
          f,
          variableName: template.variableName,
          preparedHtml,
          parts,
          securityBrand: this.securityBrandIdent,
        })
      );
    }

    const addedTopLevelTemplates: ts.Statement[] = [
      ...(topLevelTemplates as ts.Statement[]),
      ts.visitEachChild(
        node,
        (node: ts.Node) => this.rewriteTemplates(node),
        this.context
      ) as ts.Statement,
    ];

    // Add the security brand once.
    if (
      this.addedSecurityBrandVariableStatement === null &&
      topLevelTemplates.length > 0
    ) {
      this.addedSecurityBrandVariableStatement = createSecurityBrandTagFunction(
        {
          f,
          securityBrandIdent: this.securityBrandIdent,
        }
      );
      addedTopLevelTemplates.unshift(this.addedSecurityBrandVariableStatement);
    }

    return addedTopLevelTemplates;
  }

  /**
   * Given the AST representation of an html tagged template expression, turn it
   * into a CompiledTemplateResult.
   *
   * E.g., the following code:
   *
   * ```ts
   * html`<h1>Hello ${name}${'!'}</h1>`;
   * ```
   *
   * will be replaced with:
   *
   * ```ts
   * { ["_$litType$"]: lit_template_1, values: [name, '!'] }
   * ```
   *
   * The identifier `lit_template_1` is stored in `this.expressionToTemplate`,
   * and references the `CompiledTemplate`.
   *
   * If the node passed in is not a Lit template the method returns the node
   * unchanged.
   */
  private rewriteTemplateResultToCompiledTemplateResult(
    node: ts.Node
  ): ts.Node {
    const f = this.context.factory;
    if (!ts.isTaggedTemplateExpression(node)) {
      return node;
    }
    const templateInfo = this.expressionToTemplate.get(node);
    if (templateInfo === undefined) {
      return node;
    }
    return createCompiledTemplateResult({
      f,
      variableName: templateInfo.variableName,
      templateExpression: node.template,
    });
  }
}

/**
 * A [TypeScript
 * Transformer](https://github.com/itsdouges/typescript-transformer-handbook#the-basics)
 * that optimizes lit templates.
 *
 * This transform should be used in your build setup, and will need to be used
 * with a tool that consumes TypeScript transformers. An example usage with
 * Rollup.js and @rollup/plugin-typescript is:
 *
 * @example
 * ```
 * // File: rollup.config.js
 * import typescript from '@rollup/plugin-typescript';
 * import {compileLitTemplates} from '@lit-labs/compiler';
 *
 * export default {
 *   // ...
 *   plugins: [
 *     typescript({
 *       transformers: {
 *         before: [compileLitTemplates()],
 *       },
 *     }),
 *     // other rollup plugins
 *   ],
 * };
 * ```
 */
export const compileLitTemplates = (): ts.TransformerFactory<ts.SourceFile> =>
  CompiledTemplatePass.getTransformer();

/**
 * Regex to detect if an invalid octal sequence was used. It also detects the
 * invalid sequences: `\8` and `\9`. References:
 *   - eslint no-octal-escape rule:
 *     https://github.com/eslint/eslint/blob/main/lib/rules/no-octal-escape.js
 *   - Chromium octal escape sequence scanner:
 *     https://source.chromium.org/chromium/chromium/src/+/181fa1f62f501c27ed19fcb69206a0e2e1eff513:v8/src/parsing/scanner.cc;l=452-460
 */
const containsOctalEscapeRegex = /^([^\\|\s]|\\.)*?\\(0)*[1-9]/;

/**
 * This check is needed because an invalid octal sequence in an uncompiled
 * template is detected by the `html` tag function. But when compiled, the
 * invalid octal sequence creates something like the following:
 *
 * `` brand`\2` ``
 *
 * This results in an undefined entry in the template strings array. lit then
 * simply renders the `undefined` directly on the page as text. A worse result
 * is if the octal is adjacent to other content, e.g. `` html`<p>Hi</p>\2` ``.
 * If compiled naively, this will only render `undefined` on the page. Thus we
 * do not compile templates containing invalid octal sequences.
 *
 * Reference: ["0"-prefixed octal literals and octal escape seq. are
 * deprecated.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Deprecated_octal)
 */
const templateContainsOctalEscapes = (
  templateExpression: ts.TemplateLiteral
): boolean => {
  // Just for the deprecated octal check, we need to use `rawText`. Otherwise
  // strings are escaped in strange ways which cause the regex to fail.
  const rawTextForOctalCheck = ts.isNoSubstitutionTemplateLiteral(
    templateExpression
  )
    ? ([templateExpression.rawText] as unknown as TemplateStringsArray)
    : ([
        templateExpression.head.rawText,
        ...templateExpression.templateSpans.map((s) => s.literal.rawText),
      ] as unknown as TemplateStringsArray);

  for (const staticString of rawTextForOctalCheck) {
    if (containsOctalEscapeRegex.test(staticString)) {
      return true;
    }
  }
  return false;
};
