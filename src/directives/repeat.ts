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

import {createMarker, directive, Directive, NodePart, removeNodes, reparentNodes} from '../lit-html.js';

export type KeyFn<T> = (item: T) => any;
export type ItemTemplate<T> = (item: T, index: number) => any;

const keyMapCache = new WeakMap<NodePart, Map<any, NodePart>>();

function cleanMap(part: NodePart, key: any, map: Map<any, NodePart>) {
  if (!part.startNode.parentNode) {
    map.delete(key);
  }
}

export function repeat<T>(
    items: T[], keyFn: KeyFn<T>, template: ItemTemplate<T>):
    Directive<NodePart>;
export function repeat<T>(
    items: T[], template: ItemTemplate<T>): Directive<NodePart>;
export function repeat<T>(
    items: Iterable<T>,
    keyFnOrTemplate: KeyFn<T>|ItemTemplate<T>,
    template?: ItemTemplate<T>): Directive<NodePart> {
  let keyFn: KeyFn<T>;
  if (arguments.length === 2) {
    template = keyFnOrTemplate;
  } else if (arguments.length === 3) {
    keyFn = keyFnOrTemplate as KeyFn<T>;
  }

  return directive((part: NodePart): void => {
    let keyMap = keyMapCache.get(part);
    if (keyMap === undefined) {
      keyMap = new Map();
      keyMapCache.set(part, keyMap);
    }
    const container = part.startNode.parentNode as HTMLElement | ShadowRoot |
        DocumentFragment;
    let index = -1;
    let currentMarker = part.startNode.nextSibling!;

    for (const item of items) {
      let result;
      let key;
      try {
        ++index;
        result = template !(item, index);
        key = keyFn ? keyFn(item) : index;
      } catch (e) {
        console.error(e);
        continue;
      }

      // Try to reuse a part
      let itemPart = keyMap.get(key);
      if (itemPart === undefined) {
        // TODO(justinfagnani): We really want to avoid manual marker creation
        // here and instead use something like part.insertBeforePart(). This
        // requires a little refactoring, like iterating through values and
        // existing parts like NodePart#_setIterable does. We can also remove
        // keyMapCache and use part._value instead.
        // But... repeat() is badly in need of rewriting, so we'll do this for
        // now and revisit soon.
        const marker = createMarker();
        const endNode = createMarker();
        container.insertBefore(marker, currentMarker);
        container.insertBefore(endNode, currentMarker);
        itemPart = new NodePart(part.templateFactory);
        itemPart.insertAfterNode(marker);
        if (key !== undefined) {
          keyMap.set(key, itemPart);
        }
      } else if (currentMarker !== itemPart.startNode) {
        // Existing part in the wrong position
        const end = itemPart.endNode.nextSibling!;
        if (currentMarker !== end) {
          reparentNodes(container, itemPart.startNode, end, currentMarker);
        }
      } else {
        // else part is in the correct position already
        currentMarker = itemPart.endNode.nextSibling!;
      }

      itemPart.setValue(result);
      itemPart.commit();
    }

    // Cleanup
    if (currentMarker !== part.endNode) {
      removeNodes(container, currentMarker, part.endNode);
      keyMap.forEach(cleanMap);
    }
  });
}
