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

export const stripExpressionDelimeters = (html: string) => html;
    // html.replace(/^<!--lit-html\sindex="(\d+)"-->/g, '');

export const stripLitComments = (element: Element) => {
  const clone = element.cloneNode(true) as Element;
  const walker = document.createTreeWalker(
    clone,
      NodeFilter.SHOW_COMMENT,
      null as any,
      false);
  let nodesToRemove = [];
  while (walker.nextNode()) {
    if (walker.currentNode!.nodeValue!.includes('lit-html')) {
      nodesToRemove.push(walker.currentNode);
    }
  }
  for (const node of nodesToRemove) {
    node.parentNode!.removeChild(node);
  }
  return clone.innerHTML;
};
