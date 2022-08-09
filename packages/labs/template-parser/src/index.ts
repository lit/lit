/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {_$LH} from 'lit-html/private-ssr-support.js';
const {
  getTemplateHtml,
  marker,
  markerMatch,
  boundAttributeSuffix,
  PartType,
  HTML_RESULT,
} = _$LH;
import type {TemplateResult} from 'lit-html';
export type {TemplateResult};

export {PartType, HTML_RESULT};
type PartTypeType = typeof PartType[keyof typeof PartType];

import {
  type DefaultTreeAdapterMap,
  defaultTreeAdapter,
  parseFragment,
  TreeAdapter,
  TreeAdapterTypeMap,
  Token,
} from 'parse5';

type P5TextNode = DefaultTreeAdapterMap['textNode'];
type P5Element = DefaultTreeAdapterMap['element'];
type P5CommentNode = DefaultTreeAdapterMap['commentNode'];
type P5Document = DefaultTreeAdapterMap['document'];
type P5DocumentType = DefaultTreeAdapterMap['documentType'];
type P5DocumentFragment = DefaultTreeAdapterMap['documentFragment'];
type P5Template = DefaultTreeAdapterMap['template'];

// Augment the Parse5 AST types with litPart and litNodeIndex
export interface Element extends P5Element {
  isDefinedCustomElement?: boolean;
  litPart?: PartInfo;
  litNodeIndex: number;
  childNodes: ChildNode[];
  parentNode: ParentNode | null;
  attrs: Attribute[];
}
export interface CommentNode extends P5CommentNode {
  litPart?: PartInfo;
  litNodeIndex: number;
  parentNode: ParentNode | null;
}
export interface TextNode extends P5TextNode {
  litPart?: PartInfo;
  parentNode: ParentNode | null;
}
export interface Template extends P5Template {
  isDefinedCustomElement?: boolean;
  litPart?: PartInfo;
  litNodeIndex: number;
  childNodes: ChildNode[];
  parentNode: ParentNode | null;
  attrs: Attribute[];
}
export interface Document extends P5Document {
  litPart?: PartInfo;
  childNodes: ChildNode[];
}
export interface DocumentFragment extends P5DocumentFragment {
  litPart?: PartInfo;
  childNodes: ChildNode[];
}
export interface DocumentType extends P5DocumentType {
  litPart?: PartInfo;
}
export interface Attribute extends Token.Attribute {
  litPart?: AttributePartInfo;
}

export type ParentNode = Document | DocumentFragment | Element | Template;
export type ChildNode =
  | Element
  | Template
  | CommentNode
  | TextNode
  | DocumentType;
export type Node = ParentNode | ChildNode;

type LitTreeAdapterTypeMap = TreeAdapterTypeMap<
  Node,
  ParentNode,
  ChildNode,
  Document,
  DocumentFragment,
  Element,
  CommentNode,
  TextNode,
  Template,
  DocumentType
>;
const litTreeAdapter =
  defaultTreeAdapter as unknown as TreeAdapter<LitTreeAdapterTypeMap>;

const {
  isElementNode: isElement,
  isCommentNode,
  isTextNode,
} = defaultTreeAdapter;
export {isElement, isCommentNode, isTextNode};

export type GetChildNodes = (node: ParentNode) => ChildNode[] | undefined;
export const defaultChildNodes: GetChildNodes = (node: ParentNode) =>
  node.childNodes;

export interface Visitor {
  pre?: (node: Node, parent?: ParentNode) => boolean | void;
  post?: (node: Node, parent?: ParentNode) => boolean | void;
  getChildNodes?: GetChildNodes;
}

export const traverse = (node: Node, visitor: Visitor, parent?: ParentNode) => {
  const getChildNodes: GetChildNodes =
    visitor.getChildNodes ?? defaultChildNodes;
  let visitChildren: boolean | void = true;

  if (typeof visitor.pre === 'function') {
    visitChildren = visitor.pre(node, parent);
  }

  if (visitChildren !== false) {
    const childNodes = getChildNodes(node as ParentNode);
    if (childNodes !== undefined) {
      for (const child of childNodes) {
        traverse(child, visitor, node as ParentNode);
      }
    }
  }

  if (typeof visitor.post === 'function') {
    visitor.post(node, parent);
  }
};

export interface PartInfo {
  type: PartTypeType;
  valueIndex: number;
}

interface AttributePartInfo extends PartInfo {
  prefix: string | undefined;
  name: string | undefined;
  strings: string[];
}

export const hasChildPart = (
  node: Node
): node is CommentNode & {litPart: PartInfo} => {
  return node.litPart?.type === PartType.CHILD;
};

export const hasAttributePart = (
  node: Attribute
): node is Attribute & {litPart: AttributePartInfo} => {
  return Boolean(node.litPart);
};

type AstVisitor = {
  pre?(node: Node, parent: Node | undefined, html: string): void;
  post?(node: Node, parent: Node | undefined, html: string): void;
};

export interface ParsedTemplateResult {
  ast: Node;
  html: string;
}

export const parseTemplateResult = (
  result: TemplateResult,
  visitor?: AstVisitor
): ParsedTemplateResult => {
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
    treeAdapter: litTreeAdapter,
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
              attrIndex++;
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
