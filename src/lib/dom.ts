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

/**
 * @module lit-html
 */

interface MaybePolyfilledCe extends CustomElementRegistry {
  readonly polyfillWrapFlushCallback?: object;
}

/**
 * True if the custom elements polyfill is in use.
 */
export const isCEPolyfill = window.customElements !== undefined &&
    (window.customElements as MaybePolyfilledCe).polyfillWrapFlushCallback !==
        undefined;

/**
 * Reparents nodes, starting from `start` (inclusive) to `end` (exclusive),
 * into another container (could be the same container), before `before`. If
 * `before` is null, it appends the nodes to the container.
 */
export const reparentNodes =
    (container: Node,
     start: Node|null,
     end: Node|null = null,
     before: Node|null = null): void => {
      while (start !== end) {
        const n = start!.nextSibling;
        container.insertBefore(start!, before);
        start = n;
      }
    };

/**
 * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
 * `container`.
 */
export const removeNodes =
    (container: Node, start: Node|null, end: Node|null = null): void => {
      while (start !== end) {
        const n = start!.nextSibling;
        container.removeChild(start!);
        start = n;
      }
    };

/**
 * A shared TreeWalker that iterates Elements, Comments, and Texts.
 * We share the TreeWalker to avoid its slow construction.
 * Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
 */
const walker = document.createTreeWalker(
    document, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);

/**
 * Returns a "clean" tree walker. We guarantee that it is clean by requiring it
 * to be reset after each use. This gives avoids any issues with the TreeWalker
 * holding onto Nodes that could otherwise be GC'd. It also ensures we don't
 * hit any reentrancy bugs.
 */
export const elementCommentTextWalker = (root: Node): TreeWalker => {
  if (walker.currentNode !== document) {
    throw new Error('walker was not reset');
  }
  walker.currentNode = root;
  return walker;
};

/**
 * Resets the TreeWalker so that it doesn't hold onto any GC'able Nodes.
 */
export const resetElementCommentTextWalker = () => {
  walker.currentNode = document;
};
