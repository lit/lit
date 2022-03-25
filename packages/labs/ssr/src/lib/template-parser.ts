/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {TemplateResult} from 'lit';

import * as parse5 from 'parse5';

import {PartType} from 'lit-html/part-types.js';

import {
  traverse,
  parseFragment,
  isCommentNode,
  isElement,
  isTextNode,
} from './util/parse5-utils.js';

export {isElement, isCommentNode, isTextNode, traverse};
export type Node = parse5.Node;
export type ParentNode = parse5.ParentNode;
export type Element = parse5.Element;
export type ChildNode = parse5.ChildNode;
export type DocumentFragment = parse5.DocumentFragment;
export type Attribute = parse5.Attribute;
export type CommentNode = parse5.CommentNode;

export interface PartInfo {
  type: PartType;
  valueIndex: number;
}

interface AttributePartInfo extends PartInfo {
  prefix: string | undefined;
  name: string | undefined;
  strings: string[];
}

export const hasChildPart = (
  node: parse5.Node
): node is parse5.CommentNode & {litPart: PartInfo} => {
  return node.litPart?.type === PartType.CHILD;
};

export const hasAttributePart = (
  node: parse5.Attribute
): node is parse5.Attribute & {litPart: AttributePartInfo} => {
  return Boolean(node.litPart);
};

declare module 'parse5' {
  interface Element {
    isDefinedCustomElement?: boolean;
    litPart?: PartInfo;
    litNodeIndex: number;
  }
  interface CommentNode {
    litPart?: PartInfo;
    litNodeIndex: number;
  }
  interface TextNode {
    litPart?: PartInfo;
  }
  interface Document {
    litPart?: PartInfo;
  }
  interface DocumentFragment {
    litPart?: PartInfo;
  }
  interface DocumentType {
    litPart?: PartInfo;
  }
  interface Attribute {
    litPart?: AttributePartInfo;
  }
}

import {_$LH} from 'lit-html/private-ssr-support.js';
const {getTemplateHtml, marker, markerMatch, boundAttributeSuffix} = _$LH;

type AstVisitor = {
  pre?(node: parse5.Node, parent: parse5.Node | undefined, html: string): void;
  post?(node: parse5.Node, parent: parse5.Node | undefined, html: string): void;
};

export const parseTemplateResult = (
  result: TemplateResult,
  visitor?: AstVisitor
) => {
  // The property '_$litType$' needs to remain unminified.
  const [trustedHtml, attrNames] = getTemplateHtml(
    result.strings,
    result['_$litType$']
  );

  const html = String(trustedHtml);

  /* Current attribute part index, for indexing attrNames */
  let attrIndex = 0;

  // Depth-first node index, counting only comment and element nodes, to match
  // client-side lit-html.
  let nodeIndex = 0;

  let valueIndex = 0;

  /**
   * The html string is parsed into a parse5 AST with source code information
   * on; this lets us skip over certain ast nodes by string character position
   * while walking the AST.
   */
  const ast = parseFragment(String(html), {
    sourceCodeLocationInfo: true,
  });

  traverse(ast, {
    pre(node, parent) {
      if (isCommentNode(node)) {
        if (node.data === markerMatch) {
          node.litPart = {
            type: PartType.CHILD,
            valueIndex: valueIndex++,
          };
        }
        node.litNodeIndex = nodeIndex++;
      } else if (isElement(node)) {
        if (node.attrs.length > 0) {
          for (const attr of node.attrs) {
            if (attr.name.startsWith(marker)) {
              attr.litPart = {
                prefix: undefined,
                name: undefined,
                type: PartType.ELEMENT,
                strings: ['', ''],
                valueIndex,
              };
              valueIndex++;
            } else if (attr.name.endsWith(boundAttributeSuffix)) {
              const [, prefix, caseSensitiveName] = /([.?@])?(.*)/.exec(
                attrNames[attrIndex++]!
              )!;
              const strings = attr.value.split(marker);
              attr.litPart = {
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
              };
              valueIndex += strings.length - 1;
            }
          }
        }
        node.litNodeIndex = nodeIndex++;
      }
      visitor?.pre?.(node, parent, html);
    },
    post(node, parent) {
      visitor?.post?.(node, parent, html);
    },
  });

  return {ast, html};
};
