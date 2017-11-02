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

import {directive, DirectiveFn, NodePart} from '../lit-html.js';

export type KeyFn<T> = (item: T) => any;
export type ItemTemplate<T> = (item: T, index: number) => any;

interface State {
  keyMap: Map<any, NodePart>;
  parts: NodePart[];
}

const stateCache = new WeakMap<NodePart, State>();

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

  return directive((part: NodePart): any => {

    let state = stateCache.get(part);
    if (state === undefined) {
      state = {
        keyMap: new Map(),
        parts: [],
      };
      stateCache.set(part, state);
    }
    const container = part.startNode.parentNode as HTMLElement | ShadowRoot |
        DocumentFragment;
    const keyMap = state.keyMap;

    const itemParts = [];
    let index = -1;
    let currentMarker = part.startNode.nextSibling;

    for (const item of items) {
      let result;
      let key;
      try {
        ++index;
        result = template!(item, index);
        key = keyFn ? keyFn(item) : index;
      } catch (e) {
        console.error(e);
        continue;
      }

      // Try to reuse a part
      let itemPart = keyMap.get(key);

      if (itemPart === undefined) {
        const marker = document.createTextNode('');
        const endNode = document.createTextNode('');
        container.insertBefore(marker, currentMarker);
        container.insertBefore(endNode, currentMarker);
        itemPart = new NodePart(part.instance, marker, endNode);
        if (key !== undefined) {
          keyMap.set(key, itemPart);
        }
      } else if (currentMarker !== itemPart.startNode) {
        // Existing part in the wrong position
        const range = document.createRange();
        range.setStartBefore(itemPart.startNode);
        range.setEndAfter(itemPart.endNode);
        const contents = range.extractContents();
        container.insertBefore(contents, currentMarker);
      } else {
        // else part is in the correct position already
        currentMarker = itemPart.endNode.nextSibling;
      }

      itemPart.setValue(result);
      itemParts.push(itemPart);
    }

    // Cleanup
    if (currentMarker !== part.endNode) {
      const range = document.createRange();
      range.setStartBefore(currentMarker!);
      range.setEndBefore(part.endNode);
      range.deleteContents();
    }

    state.parts = itemParts;
  });
}
