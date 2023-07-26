/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as parse5 from 'parse5';

export const parseFragment = parse5.parseFragment;

export type DocumentFragment = parse5.DefaultTreeAdapterMap['documentFragment'];
export type Node = parse5.DefaultTreeAdapterMap['node'];
export type Comment = parse5.DefaultTreeAdapterMap['commentNode'];
export type ParentNode = parse5.DefaultTreeAdapterMap['parentNode'];
type TextNode = parse5.DefaultTreeAdapterMap['textNode'];

export function isCommentNode(node: Node): node is Comment {
  return node.nodeName === '#comment';
}

export function isTextNode(node: Node): node is TextNode {
  return node.nodeName === '#text';
}

const getChildNodes: (node: ParentNode) => Array<Node> | undefined = (
  node: ParentNode
) => node.childNodes;

/**
 * Traverse the parse5 Node subtree using a pre-order traversal. This traversal
 * is used as a Node.js equivalent of using a TreeWalker, as lit-html does
 * client side.
 *
 * The visitor will be called on each node.
 */
export const traverse = (
  node: Node,
  visitor: (node: Node) => boolean | void
) => {
  let visitChildren: boolean | void = true;

  visitChildren = visitor(node);

  if (visitChildren !== false) {
    const childNodes = getChildNodes(node as ParentNode);
    if (childNodes !== undefined) {
      for (const child of childNodes) {
        traverse(child, visitor);
      }
    }
  }
};
