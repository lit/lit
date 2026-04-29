/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  traverse,
  replaceWith,
  isElementNode,
  Element,
  Node,
} from '@parse5/tools';

export function removeFakeRootElements(node: Node) {
  const fakeRootElements: Element[] = [];

  traverse(node, {
    'pre:node': (node) => {
      if (
        isElementNode(node) &&
        node.nodeName &&
        node.nodeName.match(/^(html|head|body)$/i) &&
        !node.sourceCodeLocation
      ) {
        fakeRootElements.unshift(node);
      }
    },
  });

  for (const el of fakeRootElements) {
    replaceWith(el, ...el.childNodes);
  }
}
