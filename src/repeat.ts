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

import { InstancePart } from "./lit-html.js";

export type KeyFn<T> = (item: T) => any;
export type ItemTemplate<T> = (item: T, index: number) => any;
export type RepeatResult = (part: InstancePart) => any;

const keyMaps = new WeakMap<InstancePart, Map<any, InstancePart>>();

export function repeat<T>(items: T[], keyFn: KeyFn<T>, template: ItemTemplate<T>): RepeatResult;
export function repeat<T>(items: T[], template: ItemTemplate<T>): RepeatResult;
export function repeat<T>(items: Iterable<T>, keyFnOrTemplate: KeyFn<T>|ItemTemplate<T>, template?: ItemTemplate<T>): RepeatResult {
  let keyFn: KeyFn<T>;
  if (arguments.length === 2) {
    template = keyFnOrTemplate;
  } else if (arguments.length === 3) {
    keyFn = keyFnOrTemplate as KeyFn<T>;
  }

  return function (part: InstancePart): any {
    let keyMap = keyMaps.get(part);
    if (keyMap === undefined && keyFn !== undefined) {
      keyMap = new Map();
      keyMaps.set(part, keyMap);
    }
    let index = 0;

    let itemStart = part.startNode;
    let itemEnd;
    const values = items[Symbol.iterator]() as Iterator<any>;

    let current = values.next();
    let next = values.next();
    while (!current.done) {
      if (next.done) {
        // on the last item
        itemEnd = part.endNode;
      } else {
        itemEnd = new Text();
        part.endNode.parentNode!.insertBefore(itemEnd, part.endNode);
      }

      const item = current.value;
      let result;
      let key;
      try {
        result = template!(item, index++);
        key = keyFn && keyFn(item);
      } catch(e) {
        console.error(e);
        continue;
      }
      let itemPart = keyMap && keyMap.get(key);
      console.log('key', key, 'itemPart', itemPart);
      if (itemPart === undefined) {
        itemPart = new InstancePart(itemStart, itemEnd);
        if (key !== undefined && keyMap !== undefined) {
          keyMap.set(key, itemPart!);
        }
      }
      itemPart.setValue(result);
      current = next;
      next = values.next();
      itemStart = itemEnd;
    }
  };
}
