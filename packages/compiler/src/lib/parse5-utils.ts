/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * TODO(usergenic): The following set of helper functions are more-or-less
 * copied from the npm package dom5 which could not be brought in at this
 * time because it is bound to `parse5@4` where this package uses `parse5@5`.
 * Once dom5 is updated, we can just use that package and not maintain these
 * here.
 */
import * as parse5 from 'parse5';

export const parseFragment = parse5.parseFragment;

export type DocumentFragment = parse5.DefaultTreeAdapterMap['documentFragment'];
export type Node = parse5.DefaultTreeAdapterMap['node'];
export type Element = parse5.DefaultTreeAdapterMap['element'];
export type Comment = parse5.DefaultTreeAdapterMap['commentNode'];
export type ParentNode = parse5.DefaultTreeAdapterMap['parentNode'];

export function isElement(node: Node): node is Element {
  return (node as Element).tagName !== undefined;
}

export function isCommentNode(node: Node): node is Comment {
  return node.nodeName === '#comment';
}

export function isDocumentFragment(node: Node): node is DocumentFragment {
  return node.nodeName === '#document-fragment';
}

export type GetChildNodes = (node: ParentNode) => Array<Node> | undefined;
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
