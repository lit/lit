/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {_$LH as litHtmlPrivate} from 'lit-html/private-ssr-support.js';
import {
  traverse,
  parseFragment,
  isCommentNode,
  isElement,
  DocumentFragment,
  isTextNode,
  textContent,
} from './parse5-utils.js';
import {serialize} from 'parse5';
import {
  addPartConstructorImport,
  createCompiledTemplate,
  createCompiledTemplateResult,
  createSecurityBrandTagFunction,
  createTemplateParts,
  PartType,
  TemplatePart,
} from './ast-fragments.js';
const {getTemplateHtml, marker, markerMatch, boundAttributeSuffix} =
  litHtmlPrivate;

interface TemplateInfo {
  topStatement: ts.Statement;
  node: ts.TaggedTemplateExpression;
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
 * CompiledTemplatePass provides a `ts.TransformerFactory` that transforms
 * html tagged templates into a CompiledTemplateResult.
 */
class CompiledTemplatePass {
  static get_transformer(): ts.TransformerFactory<ts.SourceFile> {
    return (
      context: ts.TransformationContext
    ): ts.Transformer<ts.SourceFile> => {
      return (sourceFile: ts.SourceFile): ts.SourceFile => {
        const pass = new CompiledTemplatePass(context);
        pass.findTemplates(sourceFile);
        if (!pass.shouldCompileFile) {
          return sourceFile;
        }
        const transformedSourceFile = pass.rewriteTemplates(sourceFile);
        if (!ts.isSourceFile(transformedSourceFile)) {
          throw new Error(
            `Internal Error: Expected source file to be transformed into another source file.`
          );
        }
        if (pass.shouldAddPartImports) {
          if (pass.addedSecurityBrandVariableStatement === null) {
            throw new Error(
              `Invariant error: a security brand must exist if templates were compiled`
            );
          }
          return addPartConstructorImport(
            transformedSourceFile,
            pass.addedSecurityBrandVariableStatement,
            context.factory
          );
        }
        return transformedSourceFile;
      };
    };
  }

  private topLevelStatementToTemplate = new Map<ts.Statement, TemplateInfo[]>();
  private expressionToTemplate = new Map<
    ts.TaggedTemplateExpression,
    TemplateInfo
  >();
  private templatesThatCannotBeCompiled = new Set<ts.Node>();
  // Only compile `html` tag if it was found in an import declaration,
  // imported from lit or lit-html.
  private shouldCompileFile = false;
  private shouldAddPartImports = false;
  addedSecurityBrandVariableStatement: ts.Statement | null = null;

  private securityBrandIdent: ts.Identifier;
  private constructor(private readonly context: ts.TransformationContext) {
    this.securityBrandIdent = context.factory.createUniqueName('b');
  }

  /**
   * Find all Lit templates and decide whether the file should be compiled.
   *
   * Walks all children for the sourceFile and populates state on the class
   * instance that will be used in the future for acting on the transform.
   */
  private findTemplates(sourceFile: ts.SourceFile) {
    // Store the stack of open ancestor nodes from sourceFile to the
    // current node so that we can quickly get the top-level statement
    // that contains a template.
    const nodeStack: Array<ts.Node> = [];

    const findTemplates = <T extends ts.Node>(node: T) => {
      return ts.visitNode(node, (node: ts.Node): ts.Node => {
        nodeStack.push(node);
        this.shouldCompileFile ||= this.detectIfShouldCompileTemplate(node);
        if (isLitTemplate(node)) {
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
   * Returns true if passed a node that marks the file for compilation.
   * Currently files are marked for compilation if an importClause is detected
   * that contains an `html` import from `lit` or `lit-html`.
   */
  private detectIfShouldCompileTemplate<T extends ts.Node>(node: T): boolean {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      (node.moduleSpecifier.text === 'lit' ||
        node.moduleSpecifier.text === 'lit-html') &&
      node.importClause?.namedBindings != null &&
      ts.isNamedImports(node.importClause.namedBindings)
    ) {
      const namedBindings = node.importClause.namedBindings;
      return namedBindings.elements.some(
        (imp) => ts.isIdentifier(imp.name) && imp.name.text === 'html'
      );
    }
    return false;
  }

  private rewriteTemplates<T extends ts.Node>(parentNode: T): ts.Node {
    // rewriteTemplates transforms a node by either adding a top-level
    // CompiledTemplate, or replacing a html tagged template with a
    // CompiledTemplateResult.
    const rewriteTemplates = (node: ts.Node): ts.VisitResult<ts.Node> => {
      // Insert a top-level pre-compiled definition of a template.
      if (this.topLevelStatementToTemplate.has(node as ts.Statement)) {
        return this.addTopLevelCompiledTemplate(node);
      }

      // Maybe rewrite the template expression to use the pre-compiled template
      node = this.rewriteTemplateResultToCompiledTemplateResult(node);
      return ts.visitEachChild(node, rewriteTemplates, this.context);
    };

    const rewrittenNode = ts.visitNode(parentNode, rewriteTemplates);
    if (!rewrittenNode) {
      throw new Error(`Internal Error: Unexpected undefined 'rewrittenNode'.`);
    }
    return rewrittenNode;
  }

  /**
   * This code is identical to the logic that occurs when preparing a lit-html
   * `Template` (the internal class in lit-html.ts). It has been modified to use
   * parse5 instead of the browser but otherwise is extremely similar.
   *
   * Because the prepared HTML will contribute to file size, markers have been
   * stripped out, and comment nodes are using the 3 byte: `<?>` format.
   *
   * Because we are not running on the browser there are some concessions that
   * have occurred:
   *  - raw text elements are not handled if they have multiple bindings.
   *  - If `getTemplateHtml` throws, we do not compile the template.
   */
  private litHtmlPrepareRenderPhase(templateExpression: ts.TemplateLiteral):
    | {
        shouldCompile: false;
      }
    | {shouldCompile: true; preparedHtml: string; parts: TemplatePart[]} {
    // Generate parts array
    const parts: Array<TemplatePart> = [];
    const spoofedTemplate = ts.isNoSubstitutionTemplateLiteral(
      templateExpression
    )
      ? ([templateExpression.text] as unknown as TemplateStringsArray)
      : ([
          templateExpression.head.text,
          ...templateExpression.templateSpans.map((s) => s.literal.text),
        ] as unknown as TemplateStringsArray);
    // lit-html tries to enforce that `getTemplateHtml` only accepts a
    // TemplateStringsResult.
    (spoofedTemplate as unknown as {raw: string}).raw = '';
    let html: TrustedHTML | string = '';
    let attrNames: (string | undefined)[] = [];
    try {
      [html, attrNames] = getTemplateHtml(spoofedTemplate, 1);
    } catch {
      return {shouldCompile: false};
    }
    const ast = parseFragment(html as unknown as string, {
      sourceCodeLocationInfo: false,
    }) as DocumentFragment;

    let nodeIndex = -1;

    /* Current attribute part index, for indexing attrNames */
    let attrIndex = 0;

    let shouldCompile = true;
    traverse(ast, {
      pre: (node, _parent) => {
        if (isElement(node)) {
          const attributesToRemove = new Set<unknown>();
          if (node.attrs.length > 0) {
            const tagName = node.tagName;
            for (const attr of node.attrs) {
              if (
                attr.name.endsWith(boundAttributeSuffix) ||
                attr.name.startsWith(marker)
              ) {
                attributesToRemove.add(attr);
                const strings = attr.value.split(marker);
                // We store the case-sensitive name from `attrNames` (generated
                // while parsing the template strings); note that this assumes
                // parse5 attribute ordering matches string ordering
                const [, prefix, caseSensitiveName] = /([.?@])?(.*)/.exec(
                  attrNames[attrIndex++]!
                )!;
                // TODO: Why is this a string undefined?
                if (caseSensitiveName !== 'undefined') {
                  parts.push({
                    type: PartType.ATTRIBUTE,
                    index: nodeIndex,
                    name: caseSensitiveName,
                    strings,
                    tagName,
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
                this.shouldAddPartImports = true;
              }
            }
            node.attrs = node.attrs.filter(
              (attr) => !attributesToRemove.has(attr)
            );
          }
          if (rawTextElement.test(node.tagName)) {
            const hasNoMarkers = !textContent(node).includes(marker);
            if (!hasNoMarkers) {
              shouldCompile = false;
            }
          }
        } else if (isCommentNode(node)) {
          if (node.data === markerMatch) {
            // make a childPart
            parts.push({
              type: PartType.CHILD,
              index: nodeIndex,
            });
            // We have stored a reference to this comment node - so we can remove the comment text.
            node.data = '';
          } else {
            let i = -1;
            while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
              // Comment node has a binding marker inside, make an inactive part
              // The binding won't work, but subsequent bindings will
              parts.push({type: PartType.COMMENT_PART, index: nodeIndex});
              // Move to the end of the match
              i += marker.length - 1;
            }
            // In the compiled result, remove the markers, so compiled
            // files are deterministic.
            node.data = node.data.split(marker).join('');
          }
        } else if (isTextNode(node)) {
          // We do not want to count text nodes.
          nodeIndex--;
        }
        nodeIndex++;
      },
    });
    if (!shouldCompile) {
      return {shouldCompile: false};
    }

    const preparedHtml = serialize(ast).replace(
      /(<!---->)|(<!--\?-->)/g,
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
        `Invalid usage of 'addTopLevelCompiledTemplate'. 'this.topLevelStatementToTemplate' must contain 'node'.`
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
        this.templatesThatCannotBeCompiled.add(template.node);
        continue;
      }
      const {parts: partData, preparedHtml} = result;
      const parts = createTemplateParts({f, parts: partData});

      // Compiled template expression
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
    if (
      this.addedSecurityBrandVariableStatement === null &&
      topLevelTemplates.length
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
   * In the example code that `lit_template_1` is stored in
   * `this.expressionToTemplate`, and contains the prepared HTML and template
   * parts.
   *
   * If the node passed in is not a Lit template or cannot be compiled, the
   * method returns the node unchanged.
   */
  private rewriteTemplateResultToCompiledTemplateResult(
    node: ts.Node
  ): ts.Node {
    const f = this.context.factory;
    if (!isLitTemplate(node) || this.templatesThatCannotBeCompiled.has(node)) {
      return node;
    }

    const templateInfo = this.expressionToTemplate.get(node);
    if (templateInfo === undefined) {
      throw new Error(`template info not found for ${node.getText()}`);
    }
    // A LitTemplate can contain other templates in the values array that
    // need to be compiled.
    const templateExpression = node.template;

    return createCompiledTemplateResult({
      f,
      variableName: templateInfo.variableName,
      templateExpression,
    });
  }
}

export const compileLitTemplates = (): ts.TransformerFactory<ts.SourceFile> =>
  CompiledTemplatePass.get_transformer();

/**
 * E.g. html`foo` or html`foo${bar}`
 */
const isLitTemplate = (node: ts.Node): node is ts.TaggedTemplateExpression =>
  ts.isTaggedTemplateExpression(node) &&
  ts.isIdentifier(node.tag) &&
  node.tag.escapedText === 'html';
