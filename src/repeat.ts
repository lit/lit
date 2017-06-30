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

import { TemplateResult, TemplateInstance, html } from "./lit-html.js";

export type KeyFn<T> = (item: T) => any;
export type ItemTemplate<T> = (item: T, index: number) => TemplateResult;
export type RepeatResult = (target: Node) => TemplateResult;

export function repeat<T>(items: T[], keyFn: KeyFn<T>, template: ItemTemplate<T>): RepeatResult;
export function repeat<T>(items: T[], template: ItemTemplate<T>): RepeatResult;
export function repeat<T>(items: Iterable<T>, keyFnOrTemplate: KeyFn<T>|ItemTemplate<T>, template?: ItemTemplate<T>): RepeatResult {
  let keyFn: KeyFn<T>;
  if (arguments.length === 2) {
    template = keyFnOrTemplate;
  } else if (arguments.length === 3) {
    keyFn = keyFnOrTemplate as KeyFn<T>;
  }

  return function (target: Node): TemplateResult {
    console.log('target', target);
    let keyMap = (target as any).__keyMap;
    if (keyMap === undefined && keyFn !== undefined) {
      keyMap = (target as any).__keyMap = new Map();
    }
    let index = 0;

    let currentMarker: Node = target.__templateInstance!.startNode;
    // TODO: set to node.__templateInstance.startNode?
    // need to get clearer on marker nodes!

    const itemInstances: any[] = [];
    const repeatResult = html`${itemInstances}`;

    for (const item of items) {
      try {
        const result = template!(item, index++);
        const key = keyFn && keyFn(item);
        let nextMarker = keyFn && keyMap.get(key);
        if (nextMarker !== undefined) {
          // add the new marker after the current marker's end range
          const currentEnd = currentMarker.__templateInstance!.endNode;
          currentMarker.parentNode!.insertBefore(nextMarker, currentEnd!.nextSibling);
          const instance = nextMarker.__templateInstance as TemplateInstance;
          if (instance !== undefined && instance._template === result.template) {
            instance.update(result.values);
          }
        } else {
          nextMarker = new Text();
          // add the new marker after the current marker's end range
          const currentEnd = currentMarker.__templateInstance!.endNode;
          currentMarker.parentNode!.insertBefore(nextMarker, currentEnd!.nextSibling);
          result.renderAt(nextMarker);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return repeatResult;
  };
}
