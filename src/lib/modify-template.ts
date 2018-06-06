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

import {Template} from '../lit-html.js';

/**
 * Removes the list of nodes from a Template safely. In addition to removing
 * nodes from the Template, the Template part indices are updated to match
 * the mutated Template DOM.
 */
export function removeNodesFromTemplate(template: Template, nodesToRemove: Set<Node>) {
  const {element: {content}, parts} = template;
  const walker = document.createTreeWalker(
    content,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
        NodeFilter.SHOW_TEXT,
    null as any,
    false);
  let partIndex = 0;
  let part = parts[0];
  let nodeIndex = -1;
  let removeCount = 0;
  const nodesToRemoveInTemplate = [];
  // TODO(sorvell): fix type
  const removalStack: any[] = [];
  while (walker.nextNode()) {
    nodeIndex++;
    const node = walker.currentNode as Element;
    // maybe pop the stack
    if (walker.previousSibling === removalStack[removalStack.length - 1]) {
      removalStack.pop();
    }
    // track nodes we're removing
    if (nodesToRemove.has(node)) {
      removalStack.push(node);
      nodesToRemoveInTemplate.push(node);
    }
    if (removalStack.length > 0) {
      removeCount++;
    }
    while (part && part.index === nodeIndex) {
      part.index = removalStack.length ? -1 : part.index - removeCount;
      part = parts[++partIndex];
    }
  }
  nodesToRemoveInTemplate.forEach((n) => n.parentNode!.removeChild(n));
}

/**
 * Inserts the given node into the Template, optionally before the given
 * refNode. In addition to inserting the node into the Template, the Template
 * part indices are updated to match the mutated Template DOM.
 */
export function insertNodeIntoTemplate(
    template: Template, node: Node, refNode: Node|null = null) {
  const {element: {content}, parts} = template;
  const walker = document.createTreeWalker(
      content,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT,
      null as any,
      false);
  let partIndex = 0;
  let part = parts[partIndex];
  let partDelta = 0;
  let walkerIndex = -1;
  while (walker.nextNode()) {
    walkerIndex++;
    const currentNode = walker.currentNode as Element;
    if (currentNode === refNode) {
      content.insertBefore(node, refNode);
      partDelta = 1 + node.childNodes.length;
    }
    while (part && (part.index === walkerIndex || part.index < 0)) {
      if (part.index >= 0) {
        part.index += partDelta;
      }
      part = parts[++partIndex];
    }
  }
}
