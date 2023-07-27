/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {_$LH as litHtmlPrivate} from 'lit-html/private-ssr-support.js';
import {parseFragment, serialize} from 'parse5';
import {
  createCompiledTemplate,
  createCompiledTemplateResult,
  createSecurityBrandTagFunction,
  createTemplateParts,
  PartType,
  TemplatePart,
} from './ast-fragments.js';
import {isCommentNode, isTextNode, traverse} from '@parse5/tools';
const {getTemplateHtml, markerMatch} = litHtmlPrivate;

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
        return transformedSourceFile;
      };
    };
  }

  /**
   * Map top level statements to templates marked for compilation.
   */
  private topLevelStatementToTemplate = new Map<ts.Statement, TemplateInfo[]>();
  /**
   * Map an `html` tagged template expression to the template info.
   */
  private expressionToTemplate = new Map<
    ts.TaggedTemplateExpression,
    TemplateInfo
  >();
  /**
   * Only compile the file if an `html` tag was imported from lit or lit-html.
   */
  private shouldCompileFile = false;
  /**
   * Track the added security brand AST node so we only add one.
   */
  addedSecurityBrandVariableStatement: ts.Statement | null = null;
  /**
   * Unique security brand identifier. Used as the tag function for the prepared
   * HTML.
   */
  private securityBrandIdent: ts.Identifier;
  private constructor(private readonly context: ts.TransformationContext) {
    this.securityBrandIdent = context.factory.createUniqueName('b');
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
        this.shouldCompileFile ||= this.shouldMarkFileForCompilation(node);
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
  private shouldMarkFileForCompilation<T extends ts.Node>(node: T): boolean {
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
    try {
      [html] = getTemplateHtml(spoofedTemplate, 1);
    } catch {
      return {shouldCompile: false};
    }
    const ast = parseFragment(html as unknown as string, {
      sourceCodeLocationInfo: false,
    });

    let nodeIndex = -1;
    traverse(ast, {
      'pre:node': (node) => {
        if (isCommentNode(node)) {
          if (node.data === markerMatch) {
            parts.push({
              type: PartType.CHILD,
              index: nodeIndex,
            });
            // We have stored a reference to this comment node in the
            // TemplatePart, so we can remove the comment text. At runtime we
            // would leave the marker comment, but when compiling it's
            // advantageous to save on file size.
            node.data = '';
          }
        } else if (isTextNode(node)) {
          // Do not count text nodes.
          nodeIndex--;
        }
        nodeIndex++;
      },
    });

    // TODO(ajakubowicz): Only replace comments with markers. Otherwise if this
    // pattern is detected in a raw text node we miscompile.
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
        throw new Error(`Unhandled TODO: Will be implemented in followup.`);
      }
      const {parts: partData, preparedHtml} = result;
      const parts = createTemplateParts({f, parts: partData});

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
    if (!isLitTemplate(node)) {
      return node;
    }

    const templateInfo = this.expressionToTemplate.get(node);
    if (templateInfo === undefined) {
      throw new Error(
        `Internal Error: template info not found for ${node.getText()}`
      );
    }
    return createCompiledTemplateResult({
      f,
      variableName: templateInfo.variableName,
      templateExpression: node.template,
    });
  }
}

export const compileLitTemplates = (): ts.TransformerFactory<ts.SourceFile> =>
  CompiledTemplatePass.getTransformer();

/**
 * E.g. html`foo` or html`foo${bar}`
 */
const isLitTemplate = (node: ts.Node): node is ts.TaggedTemplateExpression =>
  ts.isTaggedTemplateExpression(node) &&
  ts.isIdentifier(node.tag) &&
  node.tag.escapedText === 'html';
