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
  polyfillWrapFlushCallback?: object;
}

/**
 * True if the custom elements polyfill is in use.
 */
export const isCEPolyfill = window.customElements !== undefined &&
    (window.customElements as MaybePolyfilledCe).polyfillWrapFlushCallback !==
        undefined;

/**
 * Reparents nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), into another container (could be the same container), before
 * `beforeNode`. If `beforeNode` is null, it appends the nodes to the
 * container.
 */
export const reparentNodes =
    (container: Node,
     start: Node|null,
     end: Node|null = null,
     before: Node|null = null): void => {
      let node = start;
      while (node !== end) {
        const n = node!.nextSibling;
        container.insertBefore(node!, before as Node);
        node = n;
      }
    };

/**
 * Removes nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), from `container`.
 */
export const removeNodes =
    (container: Node, startNode: Node|null, endNode: Node|null = null):
        void => {
          let node = startNode;
          while (node !== endNode) {
            const n = node!.nextSibling;
            container.removeChild(node!);
            node = n;
          }
        };
