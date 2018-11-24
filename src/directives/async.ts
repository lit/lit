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

import {isPrimitive} from '../lib/parts.js';
import {directive, Part} from '../lit-html.js';

interface AsyncState {
  lastRenderedIndex?: number;
  values: unknown[];
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
      values: [],
    };
    _state.set(part, state);
  }
  const previousValues = state.values;
  state.values = args;

  for (let i = 0; i < args.length; i++) {
    const promise = args[i];
    if (promise === previousValues[i]) {
      continue;
    }
    if (isPrimitive(promise) || typeof promise.then !== 'function') {
      part.setValue(promise);
      state.lastRenderedIndex = i;
      break;
    }

    // We have a value that we haven't seen before, forget what we rendered
    state.lastRenderedIndex = undefined;

    Promise.resolve(promise).then((value: unknown) => {
      const index = state.values.indexOf(promise);
      if (index === -1) {
        return;
      }
      if (state.lastRenderedIndex === undefined ||
          index < state.lastRenderedIndex) {
        state.lastRenderedIndex = index;
        part.setValue(value);
        part.commit();
      }
    });
  }
});
