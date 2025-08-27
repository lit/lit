/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing lit-html templates.
 */

import {
  isCommentNode,
  isDocument,
  isDocumentFragment,
  isElementNode,
  traverse,
} from '@parse5/tools';
import {_$LH} from 'lit-html/private-ssr-support.js';
import {parseFragment, type DefaultTreeAdapterTypes, type Token} from 'parse5';
import type ts from 'typescript';
import {
  isLitHtmlImportDeclaration,
  isResolvedPropertyAccessExpressionLitHtmlNamespace,
} from './modules.js';

export {
  isCommentNode,
  isDocumentFragment,
  isElementNode,
  isTextNode,
} from '@parse5/tools';

const {getTemplateHtml, marker, markerMatch, boundAttributeSuffix} = _$LH;

type TypeScript = typeof ts;

// Why, oh why are parse5 types so weird? We re-export them to make them easier
// to use.
export type Attribute = Token.Attribute;
export type ChildNode = DefaultTreeAdapterTypes.ChildNode;
export type CommentNode = DefaultTreeAdapterTypes.CommentNode;
export type DocumentFragment = DefaultTreeAdapterTypes.DocumentFragment;
export type Element = DefaultTreeAdapterTypes.Element;
export type Node = DefaultTreeAdapterTypes.Node;
export type TextNode = DefaultTreeAdapterTypes.TextNode;
export type ElementLocation = Token.ElementLocation;

// TODO (justinfagnani): we have a number of template tags now:
// lit-html plain, lit-html static, lit-ssr server, preact-signals, svg,
// even the css tag. We should consider returning a template tag _type_
// to support all of them.
/**
 * Returns true if the given node is a tagged template expression with the
 * lit-html template tag.
 */
export const isLitHtmlTaggedTemplateExpression = (
  node: ts.Node,
  ts: TypeScript,
  checker: ts.TypeChecker
): node is ts.TaggedTemplateExpression => {
  if (!ts.isTaggedTemplateExpression(node)) {
    return false;
  }
  if (ts.isIdentifier(node.tag)) {
    return isResolvedIdentifierLitHtmlTemplate(node.tag, ts, checker);
  }
  if (ts.isPropertyAccessExpression(node.tag)) {
    return isResolvedPropertyAccessExpressionLitHtmlNamespace(
      node.tag,
      ts,
      checker
    );
  }
  return false;
};

/**
 * Checks if the given node is the lit-html `html` tag function.
 *
 * Resolve the tag function identifier back to an import, returning true if
 * the original reference was the `html` export from `lit` or `lit-html`.
 *
 * This check handles: aliasing and reassigning the import.
 *
 * ```ts
 * import {html as h} from 'lit';
 * h``;
 * // isResolvedIdentifierLitHtmlTemplate(<h ast node>) returns true
 * ```
 *
 * ```ts
 * import {html} from 'lit-html/static.js';
 * html`false`;
 * // isResolvedIdentifierLitHtmlTemplate(<html ast node>) returns false
 * ```
 *
 * @param node a TaggedTemplateExpression tag
 */
const isResolvedIdentifierLitHtmlTemplate = (
  node: ts.Identifier,
  ts: TypeScript,
  checker: ts.TypeChecker
): boolean => {
  const symbol = checker.getSymbolAtLocation(node);
  if (!symbol) {
    return false;
  }
  const templateImport = symbol.declarations?.[0];
  if (!templateImport || !ts.isImportSpecifier(templateImport)) {
    return false;
  }

  // An import specifier has the following structures:
  //
  // `import {<propertyName> as <name>} from <moduleSpecifier>;`
  // `import {<name>} from <moduleSpecifier>;`
  //
  // This check allows aliasing `html` by ensuring propertyName is `html`.
  // Thus `{html as myHtml}` is a valid template that can be compiled.
  // Otherwise a compilable template must be a direct import of lit's `html`
  // tag function.
  if (
    (templateImport.propertyName &&
      templateImport.propertyName.text !== 'html') ||
    (!templateImport.propertyName && templateImport.name.text !== 'html')
  ) {
    return false;
  }
  const namedImport = templateImport.parent;
  if (!ts.isNamedImports(namedImport)) {
    return false;
  }
  const importClause = namedImport.parent;
  if (!ts.isImportClause(importClause)) {
    return false;
  }
  return isLitHtmlImportDeclaration(importClause.parent, ts);
};

export const PartType = {
  ATTRIBUTE: 1,
  CHILD: 2,
  PROPERTY: 3,
  BOOLEAN_ATTRIBUTE: 4,
  EVENT: 5,
  ELEMENT: 6,
} as const;

export type PartType = (typeof PartType)[keyof typeof PartType];

export type PartInfo = SinglePartInfo | AttributePartInfo;

interface BasePartInfo {
  valueIndex: number;
}

// TODO (justinfagnani): separate into ChildPartInfo and ElementPartInfo
export interface SinglePartInfo extends BasePartInfo {
  type: typeof PartType.CHILD | typeof PartType.ELEMENT;
  expression: ts.Expression;
}

export interface AttributePartInfo extends BasePartInfo {
  type:
    | typeof PartType.ATTRIBUTE
    | typeof PartType.BOOLEAN_ATTRIBUTE
    | typeof PartType.PROPERTY
    | typeof PartType.EVENT;
  prefix: string | undefined;
  name: string;
  strings: string[];
  expressions: Array<ts.Expression>;
}

/**
 * Checks if the parse5 comment node is a marker for a lit-html child part. If
 * true, the node will have a `litPart` property with the part info object.
 */
export const hasChildPart = (
  node: CommentNode
): node is LitTemplateCommentNode => {
  return (node as LitTemplateCommentNode).litPart?.type === PartType.CHILD;
};

/**
 * Retrieves the TypeScript Expression node for a parse5 comment node, if the
 * comment node is a lit-html child part marker.
 */
export const getChildPartExpression = (node: CommentNode, ts: TypeScript) => {
  if (!hasChildPart(node)) {
    return undefined;
  }
  const {valueIndex} = node.litPart!;

  let parent = node.parentNode;
  while (parent && !isDocumentFragment(parent) && !isDocument(parent)) {
    parent = parent.parentNode;
  }
  if (parent === null || isDocument(parent)) {
    // Template not found. Should be error
    return undefined;
  }

  const template = parent as LitTemplate;
  if (template.tsNode === undefined) {
    // This shouldn't happen if `hasChildPart(node)` is true, but just to be
    // safe...
    return undefined;
  }
  const taggedTemplate = template.tsNode;

  if (ts.isNoSubstitutionTemplateLiteral(taggedTemplate.template)) {
    // Invalid case!
    return undefined;
  }
  const {templateSpans} = taggedTemplate.template;
  const span = templateSpans[valueIndex];
  return span.expression;
};

export const hasAttributePart = (
  node: Attribute
): node is LitTemplateAttribute => {
  return (node as LitTemplateAttribute).litPart !== undefined;
};

export type LitTemplateNode = Node & {litNodeIndex: number};

/**
 * A parsed lit-html template. This extends a parse5 DocumentFragment with
 * additional properties to describe the lit-html parts and the original
 * TypeScript tagged-template node that the template was parsed from.
 */
export interface LitTemplate extends DocumentFragment {
  /**
   * The original TypeScript node that this template was parsed from.
   */
  tsNode: ts.TaggedTemplateExpression;

  /**
   * The template strings that would be created from this expression at runtime.
   * This is an array of strings, with the raw property set to the same array.
   */
  strings: TemplateStringsArray;

  /**
   * The template parts, including child, attribute, event, and property
   * bindings.
   */
  parts: Array<PartInfo>;
}

export interface LitTemplateCommentNode extends CommentNode {
  /**
   * If this comment is a marker for a child part, this property will be set to
   * the ParInfo for that part.
   */
  litPart?: SinglePartInfo;

  /**
   * The depth-first index of this node in the template.
   */
  litNodeIndex: number;
}

export interface LitTemplateElement extends Element {
  litNodeIndex: number;
}

export interface LitTemplateAttribute extends Attribute {
  litPart: PartInfo;
}

// Cache parsed templates by tagged template node
const templateCache = new WeakMap<ts.TaggedTemplateExpression, LitTemplate>();

/**
 * Returns all lit-html tagged template expressions in the given source file.
 */
export const getLitTemplateExpressions = (
  sourceFile: ts.SourceFile,
  ts: TypeScript,
  checker: ts.TypeChecker
): Array<ts.TaggedTemplateExpression> => {
  const templates: Array<ts.TaggedTemplateExpression> = [];

  const visitor = (tsNode: ts.Node) => {
    if (isLitHtmlTaggedTemplateExpression(tsNode, ts, checker)) {
      templates.push(tsNode);
    }
    ts.forEachChild(tsNode, visitor);
  };
  ts.forEachChild(sourceFile, visitor);

  return templates;
};

/**
 * Parses a lit-html tagged template expression into a {@linkcode LitTemplate}.
 *
 * {@linkcode LitTemplate} is a parse5 DocumentFragment with additional
 * properties to describe the lit-html parts.
 */
export const parseLitTemplate = (
  templateNode: ts.TaggedTemplateExpression,
  ts: TypeScript,
  _checker: ts.TypeChecker
): LitTemplate => {
  const cached = templateCache.get(templateNode);
  if (cached !== undefined) {
    return cached;
  }

  const strings = getTemplateStrings(templateNode, ts);
  const values = ts.isNoSubstitutionTemplateLiteral(templateNode.template)
    ? []
    : templateNode.template.templateSpans.map((s) => s.expression);
  const templateSpans = ts.isNoSubstitutionTemplateLiteral(
    templateNode.template
  )
    ? []
    : templateNode.template.templateSpans;

  const parts: Array<PartInfo> = [];
  const [html, boundAttributeNames] = getTemplateHtml(strings, 1);

  let spanIndex = 0;

  // Index of the next bound attribute in attrNames
  let boundAttributeIndex = 0;

  // Depth-first node index
  let nodeIndex = 0;

  // Adjustments to source locations based on the difference between the
  // binding expression lengths in TypeScript source vs the marker replacements
  // in the prepared and parsed HTML.

  // TODO (justinfagnani): implement line and column adjustments
  let lineAdjust = 0;
  let colAdjust = 0;
  let offsetAdjust = 0;
  let currentLine = 1;

  const nodeMarker = `<${markerMatch}>`;
  const nodeMarkerLength = nodeMarker.length;
  const source = html.toString();

  // TODO (justinfagnani): to support server-only templates that include
  // non-fragment-parser supported tags (<html>, <body>, etc) we need to
  // inspect the string and conditionally use parse() here.
  const ast = parseFragment(source, {sourceCodeLocationInfo: true});

  traverse(ast, {
    ['pre:node'](node, _parent) {
      // Adjust every node's source locations by the current adjustment values
      if (node.sourceCodeLocation !== undefined) {
        node.sourceCodeLocation!.startOffset += offsetAdjust;
        node.sourceCodeLocation!.startLine += lineAdjust;
        if (node.sourceCodeLocation!.startLine > currentLine) {
          colAdjust = 0;
          currentLine = node.sourceCodeLocation!.startLine;
        } else {
          node.sourceCodeLocation!.startCol += colAdjust;
        }
      }

      if (isCommentNode(node)) {
        if (node.data === markerMatch) {
          // A child binding, like <div>${}</div>

          const expression = values[spanIndex];
          const span = templateSpans[spanIndex];
          const spanStart = span.expression.getFullStart();
          const spanEnd = span.expression.getEnd();
          const spanLength = spanEnd - spanStart + 3;
          // Leading whitespace of an expression is included with the
          // expression. Trailing whitespace is included with the literal.
          const trailingWhitespaceLength = span.literal
            .getFullText()
            .search(/\S|$/);
          offsetAdjust +=
            spanLength + trailingWhitespaceLength - nodeMarkerLength;

          // Adjust line and column
          const expressionText = expression.getFullText();
          const expressionLines = expressionText.split(/\r?\n/);
          lineAdjust += expressionLines.length - 1;
          if (expressionLines.length > 1) {
            colAdjust = expressionLines.at(-1)!.length;
          } else {
            colAdjust +=
              spanLength + trailingWhitespaceLength - nodeMarkerLength;
          }

          parts.push(
            ((node as LitTemplateCommentNode).litPart = {
              type: PartType.CHILD,
              valueIndex: spanIndex,
              expression,
            } as SinglePartInfo)
          );
          spanIndex++;
        }
        (node as LitTemplateCommentNode).litNodeIndex = nodeIndex++;
        // TODO (justinfagnani): handle <!--${}--> (comment binding)
      } else if (isElementNode(node)) {
        const {startTag} = node.sourceCodeLocation as ElementLocation;

        // Adjust the start tag end offset before the attributes are processed
        if (startTag !== undefined) {
          startTag.startOffset += offsetAdjust;
        }

        if (node.attrs.length > 0) {
          for (const attr of node.attrs) {
            const attrSourceLocation =
              node.sourceCodeLocation?.attrs?.[attr.name];

            if (attrSourceLocation !== undefined) {
              attrSourceLocation.startLine += lineAdjust;
              attrSourceLocation.startCol += colAdjust;
              attrSourceLocation.startOffset += offsetAdjust;
            }

            if (attr.name.startsWith(marker)) {
              // An element binding, like <div ${}>

              const expression = values[spanIndex];
              const span = templateSpans[spanIndex];

              const trailingWhitespaceLength = span.literal
                .getFullText()
                .search(/\S|$/);

              offsetAdjust +=
                expression.getFullText().length +
                trailingWhitespaceLength -
                attr.name.length +
                3;
              colAdjust = offsetAdjust;

              parts.push(
                ((attr as LitTemplateAttribute).litPart = {
                  type: PartType.ELEMENT,
                  valueIndex: spanIndex,
                  expression,
                } as SinglePartInfo)
              );
              spanIndex++;
              boundAttributeIndex++;
              // TODO (justinfagnani): handle <div ${}="...">
            } else if (attr.name.endsWith(boundAttributeSuffix)) {
              // An attribute binding, like <div foo=${}>

              const [, prefix, caseSensitiveName] = /([.?@])?(.*)/.exec(
                boundAttributeNames[boundAttributeIndex++]!
              )!;
              const strings = attr.value.split(marker);
              const expressions = values.slice(
                spanIndex,
                spanIndex + strings.length - 1
              );

              // Adjust offsets
              offsetAdjust -= boundAttributeSuffix.length;
              colAdjust -= boundAttributeSuffix.length;

              const spans = templateSpans.slice(
                spanIndex,
                spanIndex + strings.length - 1
              );

              for (const span of spans) {
                const expressionLength = span.expression.getFullWidth();
                const trailingWhitespaceLength = span.literal
                  .getFullText()
                  .search(/\S|$/);
                const expressionText = span.expression.getFullText();
                const expressionLines = expressionText.split(/\r?\n/);

                offsetAdjust +=
                  expressionLength +
                  trailingWhitespaceLength -
                  marker.length +
                  3 /* For the ${} */;

                lineAdjust += expressionLines.length - 1;

                if (expressionLines.length > 1) {
                  colAdjust = expressionLines.at(-1)!.length;
                } else {
                  colAdjust +=
                    expressionLength +
                    trailingWhitespaceLength -
                    marker.length +
                    3;
                }
              }

              parts.push(
                ((attr as LitTemplateAttribute).litPart = {
                  prefix,
                  name: caseSensitiveName,
                  type:
                    prefix === '.'
                      ? PartType.PROPERTY
                      : prefix === '?'
                        ? PartType.BOOLEAN_ATTRIBUTE
                        : prefix === '@'
                          ? PartType.EVENT
                          : PartType.ATTRIBUTE,
                  strings,
                  valueIndex: spanIndex,
                  expressions,
                } as AttributePartInfo)
              );
              spanIndex += strings.length - 1;
            }

            if (attrSourceLocation !== undefined) {
              attrSourceLocation.endLine += lineAdjust;
              attrSourceLocation.endCol += colAdjust;
              attrSourceLocation.endOffset += offsetAdjust;
            }
          }
        }

        // Adjust the start tag end offset after the attributes are processed
        if (startTag !== undefined) {
          startTag.endOffset += offsetAdjust;
        }

        (node as LitTemplateElement).litNodeIndex = nodeIndex++;
        // TODO (justinfagnani): handle <${}>
      }
    },

    node(node, _parent) {
      const {sourceCodeLocation} = node;
      if (sourceCodeLocation == null) {
        return;
      }
      sourceCodeLocation.endOffset += offsetAdjust;
      sourceCodeLocation.endLine += lineAdjust;
      if (sourceCodeLocation.endLine > currentLine) {
        colAdjust = 0;
        currentLine = sourceCodeLocation!.endLine;
      } else {
        sourceCodeLocation!.endCol += colAdjust;
      }

      if (isElementNode(node)) {
        const {endTag} = sourceCodeLocation as ElementLocation;

        // Adjust the end tag offsets after element and its children are
        // processed
        if (endTag !== undefined) {
          endTag.startOffset += offsetAdjust;
          endTag.endOffset += offsetAdjust;
        }
      }
    },
  });

  const finalAst = ast as LitTemplate;
  finalAst.parts = parts;
  finalAst.strings = strings;
  finalAst.tsNode = templateNode;
  templateCache.set(templateNode, finalAst);
  return finalAst;
};

// TODO (justinfagnani): export a traverse function that takes a visitor that
// gets passed our extended Lit interfaces. Also possibly export a unified
// traverse that can traverse TypeScript and parse5 nodes. This would allow us
// to do analysis of nested templates, for rules like "A <li> element must be a
// child of a <ul> or <ol> element", even if the <li> is in a nested template.

const getTemplateStrings = (
  node: ts.TaggedTemplateExpression,
  ts: TypeScript
) => {
  let strings: TemplateStringsArray;
  const {template} = node;
  if (ts.isNoSubstitutionTemplateLiteral(template)) {
    // The slice removes the backticks
    strings = [
      template.getFullText().slice(1, -1),
    ] as unknown as TemplateStringsArray;
  } else {
    const spanCount = template.templateSpans.length;
    strings = [
      // The slice removes the opening backtick and opening ${
      template.head.getFullText().slice(1, -2),
      ...template.templateSpans.map((s, i) =>
        i === spanCount - 1
          ? // trimStart() removes trailing whitespace of the expression
            // slice() removes the closing } and closing backtick
            s.literal.getFullText().trimStart().slice(1, -1)
          : // trimStart() removes trailing whitespace of the expression
            // slice() removes the closing } and opening ${
            s.literal.getFullText().trimStart().slice(1, -2)
      ),
    ] as unknown as TemplateStringsArray;
  }
  (strings as Mutable<TemplateStringsArray, 'raw'>).raw = strings;
  Object.freeze(strings);
  return strings;
};

/**
 * Removes the `readonly` modifier from properties in the union K.
 */
type Mutable<T, K extends keyof T> = Omit<T, K> & {
  -readonly [P in keyof Pick<T, K>]: P extends K ? T[P] : never;
};
