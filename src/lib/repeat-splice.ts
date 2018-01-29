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
// @ts-ignore
import {directive, DirectiveFn, NodePart, Part, removeNodes, reparentNodes} from '../lit-html.js';
import {calculateSplices, SpliceRecord} from './array-splice.js';

export type KeyFn<T> = (item: T) => any;
export type ItemTemplate<T> = (item: T, index: number) => any;

const keyMapCache = new WeakMap<NodePart, Map<any, NodePart>>();
const lastKeysCache = new WeakMap<NodePart, Array<any>>();

function cleanMap(part: NodePart, key: any, map: Map<any, NodePart>) {
  if (!part.startNode.parentNode) {
    map.delete(key);
  }
}

export function repeat<T>(
    items: T[], keyFn: KeyFn<T>, template: ItemTemplate<T>): DirectiveFn
export function repeat<T>(items: T[], template: ItemTemplate<T>): DirectiveFn
export function repeat<T>(
    items: Iterable<T>,
    keyFnOrTemplate: KeyFn<T>| ItemTemplate<T>,
    template?: ItemTemplate<T>): DirectiveFn
{
  let keyFn: KeyFn<T>;
  if (arguments.length === 2) {
    template = keyFnOrTemplate;
  } else
  if (arguments.length === 3) {
    keyFn = keyFnOrTemplate as KeyFn<T>;
  }

  return directive((part: Part): any => {
    if (!(part instanceof NodePart)) {
      throw new Error('repeat can only be used on NodeParts');
    }

    let keyMap = keyMapCache.get(part);
    if (keyMap === undefined) {
      keyMap = new Map();
      keyMapCache.set(part, keyMap);
    }
    let oldKeyMap = new Map(keyMap);

    let lastKeys = lastKeysCache.get(part) || [];
    let newKeys: Array<any> = [];

    let index = -1;
    for (let item of items) {
      let key;
      try {
        ++index;
        key = keyFn ? keyFn(item) : item;
        newKeys.push(key);
      } catch (e) {
        console.error(e);
        continue;
      }
    }

    lastKeysCache.set(part, newKeys);

    const container = part.startNode.parentNode as HTMLElement | ShadowRoot |
        DocumentFragment;

    let records: Array<SpliceRecord> = calculateSplices(newKeys, lastKeys);
    console.log(newKeys, lastKeys);

    let result;
    let it = items[Symbol.iterator]();

    index = 0;
    let item = it.next().value;
    let key = keyFn ? keyFn(item) : item;
    let currentMarker = part.startNode.nextSibling!;

    let modified: Map<NodePart, boolean> = new Map();

    for (const record of records) {
      // Leave/Update
      while (index < record.index) {
        result = template !(item, index);

        let itemPart = keyMap.get(key);
        itemPart!.setValue(result);
        currentMarker = itemPart!.endNode.nextSibling!;

        let { value, done } = it.next();
        index++;
        if (done) {
          break;
        }
        item = value;
        key = keyFn ? keyFn(item) : item;
      }

      // Delete.
      for (let key of record.removed) {
        let itemPart = oldKeyMap.get(key)!;
        // This part might be deleted from this part, but reused later,
        // so set as potential deletion here.
        if (!modified.has(itemPart)) {
          modified.set(itemPart, true);
        }
      }

      // Add.
      let addedCount = record.addedCount;
      while (addedCount--) {
        console.log("add", key, "at", index);

        let itemPart = keyMap.get(key);
        if (itemPart) {
          // Existing part in the wrong position. Mark as non-deletable,
          // and then reposition.
          modified.set(itemPart, false);
          const end = itemPart.endNode.nextSibling;
          if (currentMarker !== end) {
            reparentNodes(container, itemPart.startNode.nextSibling, end, currentMarker);
          }
        } else {
          const marker = document.createTextNode('');
          const endNode = document.createTextNode('');
          container.insertBefore(marker, currentMarker);
          container.insertBefore(endNode, currentMarker);
          itemPart = new NodePart(part.instance, marker, endNode);
          keyMap.set(key, itemPart);
        }

        result = template !(item, index);
        itemPart!.setValue(result);

        let { value, done } = it.next();
        index++;
        if (done) {
          break;
        }
        item = value;
        key = keyFn ? keyFn(item) : item;
      }
    }

    for (let [itemPart, deletable] of modified) {
      if (deletable) {
        removeNodes(container, itemPart.startNode.nextSibling, itemPart.endNode.nextSibling);
      }
    }
    keyMap.forEach(cleanMap);
  });
}