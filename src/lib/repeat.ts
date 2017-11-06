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

import {directive, DirectiveFn, NodePart, removeNodes, reparentNodes} from '../lit-html.js';

export type KeyFn<T> = (item: T, index: number) => any;
export type ItemTemplate<T> = (item: T, index: number) => any;

interface PartState {
  itemPart: NodePart;
  renderCount: number;
};

const keyMapCache = new WeakMap<NodePart, WeakMap<any, PartState>>();
const strongMapCache = new WeakMap<NodePart, Map<any, PartState>>();

export function repeat<T>(
    items: T[], keyFn: KeyFn<T>, template: ItemTemplate<T>): DirectiveFn;
export function repeat<T>(items: T[], template: ItemTemplate<T>): DirectiveFn;
export function repeat<T>(
    items: Iterable<T>,
    keyFnOrTemplate: KeyFn<T>| ItemTemplate<T>,
    template?: ItemTemplate<T>): DirectiveFn {
  let keyFn: KeyFn<T>;
  if (arguments.length === 2) {
    template = keyFnOrTemplate;
  } else if (arguments.length === 3) {
    keyFn = keyFnOrTemplate as KeyFn<T>;
  }
  let renderCount = 0;

  return directive((part: NodePart): any => {

    if (!keyMapCache.has(part)) {
      keyMapCache.set(part, new WeakMap());
      strongMapCache.set(part, new Map());
    }
    const keyMap = keyMapCache.get(part)!;
    const strongMap = strongMapCache.get(part)!;

    const container = part.startNode.parentNode as HTMLElement | ShadowRoot |
        DocumentFragment;
    let index = 0;
    let currentMarker = part.startNode.nextSibling!;

    for (const item of items) {
      const result = template !(item, index);
      const key = keyFn ? keyFn(item, index) : item;
      const typeMap = typeof key === 'object' ? keyMap : strongMap;
      index++;

      // Try to reuse a part
      let partState = typeMap.get(key);
      let itemPart;
      if (partState === undefined) {
        const marker = document.createTextNode('');
        const endNode = document.createTextNode('');
        container.insertBefore(marker, currentMarker);
        container.insertBefore(endNode, currentMarker);
        itemPart = new NodePart(part.instance, marker, endNode);
        if (key !== undefined) {
          typeMap.set(key, {
            itemPart,
            renderCount: renderCount,
          });
        }
      } else if (partState.renderCount === renderCount) {
        // We already rendered this part this time
        continue;
      } else if (currentMarker === partState.itemPart.startNode) {
        // Existing part in correct position already
        itemPart = partState.itemPart;
        currentMarker = itemPart.endNode.nextSibling!;
      } else {
        itemPart = partState.itemPart;
        // Existing part in the wrong position
        reparentNodes(
            container,
            itemPart.startNode,
            itemPart.endNode.nextSibling!,
            currentMarker);
      }

      itemPart.setValue(result);
    }

    // Cleanup
    if (currentMarker !== part.endNode) {
      removeNodes(container, currentMarker, part.endNode);
      // Only need to iterate the strongMap, keyMap will clean itself.
      if (strongMap.size > 0) {
        strongMap.forEach((partState, key) => {
          if (partState.renderCount !== renderCount) {
            strongMap.delete(key);
          }
        });
      }
    }
    renderCount++;
  });
}
