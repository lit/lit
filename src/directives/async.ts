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

import {directive, Part} from '../lit-html.js';
import { isPrimitive } from '../lib/parts.js';

interface PromisedValue {
  index: number;
  resolved: boolean;
}

interface AsyncState {
  index?: number;
  promises: WeakMap<any, PromisedValue>;
}

const _state = new WeakMap<Part, AsyncState>();

/**
 * Renders a Promise to a Part when it resolves. `defaultContent` will be
 * rendered until the Promise resolves.
 */
export const async = directive((...args: any[]) => (part: Part) => {

  let state = _state.get(part)!;
  if (state === undefined) {
    state = {
      index: undefined,
      promises: new WeakMap<any, PromisedValue>(),
    };
    _state.set(part, state);
  } else {
    state.promises = new WeakMap<any, PromisedValue>();
  }

  let i = -1;
  for (const promise of args) {
    i++;
    if (state.index !== undefined && i > state.index) {
      break;
    }
    if (isPrimitive(promise) || typeof promise.then !== 'function') {
      part.setValue(promise);
      state.index = i;
      break;
    }
    let promisedValue = state.promises.get(promise);

    // The first time we see a value we save and await it
    if (promisedValue === undefined) {
      promisedValue = {resolved: false, index: i};
      state.promises.set(promise, promisedValue);

      Promise.resolve(promise).then((value: unknown) => {
        if (!state.promises.has(promise)) {
          return;
        }
        promisedValue!.resolved = true;
        if (state.index === undefined || promisedValue!.index < state.index) {
          state.index = promisedValue!.index;
          part.setValue(value);
          part.commit();
        }
      });
    } else {
      promisedValue.index = i;
    }
  }
});
