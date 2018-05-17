/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Template, TemplatePart} from '../lit-html.js';

export function removeNodesFromTemplate(template: Template, nodes: Node[]) {
  const {element: {content}, parts} = template;
  const walker = document.createTreeWalker(
    content,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
        NodeFilter.SHOW_TEXT,
    null as any,
    false);
  let nodesIndex = 0;
  let nodeToFind = nodes[nodesIndex];
  let partIndex = 0;
  let part = parts[partIndex];
  let partDelta = 0;
  let disableUntil = 0;
  const nodesToRemove: Node[] = [];
  let index = -1;
  while (walker.nextNode()) {
    index++;
    const node = walker.currentNode as Element;
    if (node === nodeToFind) {
      nodeToFind = nodes[++nodesIndex];
      const removeCount = node.childNodes.length + 1;
      disableUntil = index + removeCount;
      partDelta -= removeCount;
      nodesToRemove.push(node);
    }
    // adjust part indices or disable parts.
    while (part && part.index === index) {
      if (index < disableUntil) {
        part.index = -1;
      } else {
        part.index += partDelta;
      }
      part = parts[++partIndex];
    }
  }
  nodesToRemove.forEach((n) => n.parentNode!.removeChild(n));
}

export function insertNodeIntoTemplate(template: Template, node: Node, refNode: Node|null = null) {
  const {element: {content}, parts} = template;
  const walker = document.createTreeWalker(
    content,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
        NodeFilter.SHOW_TEXT,
    null as any,
    false);
  let partIndex = 0;
  let part = parts[partIndex];
  let partDelta = 0;
  let index = -1;
  while (walker.nextNode()) {
    index++;
    const currentNode = walker.currentNode as Element;
    if (currentNode === refNode) {
      content.insertBefore(node, refNode);
      partDelta = 1 + node.childNodes.length;
    }
    while (part && (part.index === index || part.index < 0)) {
      if (part.index >= 0) {
        part.index += partDelta;
      }
      part = parts[++partIndex];
    }
  }
}
