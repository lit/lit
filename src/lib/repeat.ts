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
        keyMap: keyFn && new Map(),
        parts: [],
      };
      stateCache.set(part, state);
    }
    const container = part.startNode.parentNode as HTMLElement | ShadowRoot |
        DocumentFragment;
    const oldParts = state.parts;
    const endParts = new Map<Node, NodePart>(
        oldParts.map((p) => [p.endNode, p] as [Node, NodePart]));
    const keyMap = state.keyMap;

    const itemParts = [];
    let index = 0;
    let currentMarker: Node|undefined;

    for (const item of items) {
      let result;
      let key;
      try {
        result = template !(item, index++);
        key = keyFn && keyFn(item);
      } catch (e) {
        console.error(e);
        continue;
      }

      // Try to reuse a part, either keyed or from the list of previous parts
      // if there's no keyMap
      let itemPart = keyMap === undefined ? oldParts[0] : keyMap.get(key);

      if (itemPart === undefined) {
        // New part, attach it
        if (currentMarker === undefined) {
          currentMarker = new Text();
          container.insertBefore(currentMarker, part.startNode.nextSibling);
        }
        const endNode = new Text();
        container.insertBefore(endNode, currentMarker.nextSibling);
        itemPart = new NodePart(part.instance, currentMarker, endNode);
        if (key !== undefined && keyMap !== undefined) {
          keyMap.set(key, itemPart!);
        }
      } else {
        // Existing part, maybe move it
        const range = document.createRange();
        range.setStartBefore(itemPart.startNode);
        range.setEndBefore(itemPart.endNode);

        if (currentMarker === undefined) {
          // this should be the first part, make sure it's first
          if (part.startNode.nextSibling !== itemPart.startNode) {
            // move the whole part
            // get previous and next parts
            const previousPart = endParts.get(itemPart.startNode);
            if (previousPart) {
              previousPart.endNode = itemPart.endNode;
              endParts.set(previousPart.endNode, previousPart);
            }
            const contents = range.extractContents();
            if (part.startNode.nextSibling === part.endNode) {
              // The container part was empty, so we need a new endPart
              itemPart.endNode = new Text();
              container.insertBefore(
                  itemPart.endNode, part.startNode.nextSibling);
            } else {
              // endNode should equal the startNode of the currently first part
              itemPart.endNode = part.startNode.nextSibling!;
            }
            container.insertBefore(contents, part.startNode.nextSibling);
          }
          // else part is in the correct position already
        } else if (currentMarker !== itemPart.startNode) {
          // move to correct position
          const previousPart = endParts.get(itemPart.startNode);
          if (previousPart) {
            previousPart.endNode = itemPart.endNode;
            endParts.set(previousPart.endNode, previousPart);
          }
          const contents = range.extractContents();
          container.insertBefore(contents, currentMarker);
        }

        // remove part from oldParts list so it's not cleaned up
        oldParts.splice(oldParts.indexOf(itemPart), 1);
      }
      // else part is in the correct position already

      itemPart.setValue(result);
      itemParts.push(itemPart);
      currentMarker = itemPart.endNode;
    }

    // Cleanup
    if (oldParts.length > 0) {
      const clearStart = oldParts[0].startNode;
      const clearEnd = oldParts[oldParts.length - 1].endNode;
      const clearRange = document.createRange();
      if (itemParts.length === 0) {
        clearRange.setStartBefore(clearStart);
      } else {
        clearRange.setStartAfter(clearStart);
      }
      clearRange.setEndAfter(clearEnd);
      clearRange.deleteContents();
      clearRange.detach();  // is this neccessary?
    }

    state.parts = itemParts;
  });
}
