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

import type ts from 'typescript';
import {_$LH} from 'lit-html/private-ssr-support.js';
import {parseFragment} from 'parse5';
// import type {Attribute} from 'parse5/dist/common/token.js';
import {
  Node,
  CommentNode,
  Element,
  DocumentFragment,
  isCommentNode,
  isElementNode,
  traverse,
} from '@parse5/tools';

const {getTemplateHtml, marker, markerMatch, boundAttributeSuffix} = _$LH;

type TypeScript = typeof ts;
// TODO (justinfagnani): use the real type from parse5?
type Attribute = Element['attrs'][number];

/**
 * Returns true if the specifier is know to export the Lit html template tag.
 *
 * This can be used in a hueristic to determine if a template is a lit-html
 * template.
 */
export const isKnownLitModuleSpecifier = (specifier: string): boolean => {
  return (
    specifier === 'lit' ||
    specifier === 'lit-html' ||
    specifier === 'lit-element'
  );
};

/**
 * Returns true if the given node is a tagged template expression with the
 * lit-html template tag.
 */
export const isLitTaggedTemplateExpression = (
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
 * Resolve a common pattern of using the `html` identifier of a lit namespace
 * import.
 *
 * E.g.:
 *
 * ```ts
 * import * as identifier from 'lit';
 * identifier.html`<p>I am compiled!</p>`;
 * ```
 */
const isResolvedPropertyAccessExpressionLitHtmlNamespace = (
  node: ts.PropertyAccessExpression,
  ts: TypeScript,
  checker: ts.TypeChecker
): boolean => {
  // Ensure propertyAccessExpression ends with `.html`.
  if (ts.isIdentifier(node.name) && node.name.text !== 'html') {
    return false;
  }
  // Expect a namespace preceding `html`, `<namespace>.html`.
  if (!ts.isIdentifier(node.expression)) {
    return false;
  }

  // Resolve the namespace if it has been aliased.
  const symbol = checker.getSymbolAtLocation(node.expression);
  if (!symbol) {
    return false;
  }
  const namespaceImport = symbol.declarations?.[0];
  if (!namespaceImport || !ts.isNamespaceImport(namespaceImport)) {
    return false;
  }
  const importDeclaration = namespaceImport.parent.parent;
  const specifier = importDeclaration.moduleSpecifier;
  if (!ts.isStringLiteral(specifier)) {
    return false;
  }
  return isKnownLitModuleSpecifier(specifier.text);
};

/**
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
  const importDeclaration = importClause.parent;
  if (!ts.isImportDeclaration(importDeclaration)) {
    return false;
  }
  const specifier = importDeclaration.moduleSpecifier;
  if (!ts.isStringLiteral(specifier)) {
    return false;
  }
  return isKnownLitModuleSpecifier(specifier.text);
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

export interface PartInfo {
  type: PartType;
  valueIndex: number;
}

export interface SinglePartInfo extends PartInfo {
  type: typeof PartType.CHILD | typeof PartType.ELEMENT;
  expression: ts.Expression;
}

export interface AttributePartInfo extends PartInfo {
  type:
    | typeof PartType.ATTRIBUTE
    | typeof PartType.BOOLEAN_ATTRIBUTE
    | typeof PartType.PROPERTY
    | typeof PartType.EVENT;
  prefix: string | undefined;
  name: string | undefined;
  strings: string[];
  expressions: Array<ts.Expression>;
}

export const hasChildPart = (
  node: CommentNode
): node is LitTemplateCommentNode => {
  return (node as LitTemplateCommentNode).litPart?.type === PartType.CHILD;
};

export const hasAttributePart = (
  node: Attribute
): node is LitTemplateAttribute => {
  return (node as LitTemplateAttribute).litPart !== undefined;
};

export type LitTemplateNode = Node & {
  litNodeIndex: number;
};

export interface LitTemplate extends DocumentFragment {
  strings: TemplateStringsArray;
  parts: Array<PartInfo>;
}

export interface LitTemplateCommentNode extends CommentNode {
  litPart?: SinglePartInfo;
  litNodeIndex: number;
}

export interface LitTemplateElement extends Element {
  litNodeIndex: number;
}

export interface LitTemplateAttribute extends Attribute {
  litPart: PartInfo;
}

export const parseLitTemplate = (
  node: ts.TaggedTemplateExpression,
  ts: TypeScript,
  _checker: ts.TypeChecker
): LitTemplate => {
  const strings = getTemplateStrings(node, ts);
  const values = ts.isNoSubstitutionTemplateLiteral(node.template)
    ? []
    : node.template.templateSpans.map((s) => s.expression);
  const parts: Array<PartInfo> = [];
  const [html, boundAttributeNames] = getTemplateHtml(strings, 1);

  let valueIndex = 0;

  // Index of the next bound attribute in attrNames
  let boundAttributeIndex = 0;

  // Depth-first node index
  let nodeIndex = 0;

  const ast = parseFragment(html.toString(), {
    sourceCodeLocationInfo: true,
  });

  traverse(ast, {
    ['pre:node'](node, _parent) {
      if (isCommentNode(node)) {
        if (node.data === markerMatch) {
          // An child binding, like <div>${}</div>
          const expression = values[valueIndex++];
          parts.push(
            ((node as LitTemplateCommentNode).litPart = {
              type: PartType.CHILD,
              valueIndex,
              expression,
            } as SinglePartInfo)
          );
        }
        (node as LitTemplateCommentNode).litNodeIndex = nodeIndex++;
        // TODO (justinfagnani): handle <!--${}--> (comment binding)
      } else if (isElementNode(node)) {
        if (node.attrs.length > 0) {
          for (const attr of node.attrs) {
            if (attr.name.startsWith(marker)) {
              // An element binding, like <div ${}>
              const expression = values[valueIndex++];
              parts.push(
                ((attr as LitTemplateAttribute).litPart = {
                  type: PartType.ELEMENT,
                  valueIndex,
                  expression,
                } as SinglePartInfo)
              );
              boundAttributeIndex++;
              // TODO (justinfagnani): handle <div ${}="...">
            } else if (attr.name.endsWith(boundAttributeSuffix)) {
              // An attribute binding, like <div foo=${}>
              const [, prefix, caseSensitiveName] = /([.?@])?(.*)/.exec(
                boundAttributeNames[boundAttributeIndex++]!
              )!;
              const strings = attr.value.split(marker);
              const expressions = values.slice(
                valueIndex,
                valueIndex + strings.length - 1
              );
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
                  valueIndex,
                  expressions,
                } as AttributePartInfo)
              );
              valueIndex += strings.length - 1;
            }
          }
        }
        (node as LitTemplateElement).litNodeIndex = nodeIndex++;
        // TODO (justinfagnani): handle <${}>
      }
    },
  });
  (ast as LitTemplate).parts = parts;
  (ast as LitTemplate).strings = strings;
  return ast as LitTemplate;
};

// TODO (justinfagnani): export a traverse function that takes a visitor that
// gets passed our extended Lit interfaces. Also possibly export a unified
// traverse that can traverse TypeScript and parse5 nodes. This would allow us
// to do analysis of nexted templates, for rules like "A <li> element must be a
// child of a <ul> or <ol> element", even if the <li> is in a nested template.

export const getTemplateStrings = (
  node: ts.TaggedTemplateExpression,
  ts: TypeScript
) => {
  let strings: TemplateStringsArray;
  if (ts.isNoSubstitutionTemplateLiteral(node.template)) {
    strings = [node.template.text] as unknown as TemplateStringsArray;
  } else {
    strings = [
      node.template.head.text,
      ...node.template.templateSpans.map((s) => s.literal.text),
    ] as unknown as TemplateStringsArray;
  }
  (strings as Mutable<TemplateStringsArray, 'raw'>).raw = strings;
  return strings;
};

/**
 * Removes the `readonly` modifier from properties in the union K.
 */
type Mutable<T, K extends keyof T> = Omit<T, K> & {
  -readonly [P in keyof Pick<T, K>]: P extends K ? T[P] : never;
};

export interface LitTaggedTemplateExpression
  extends ts.TaggedTemplateExpression {
  litTemplate: LitTemplate;
}
