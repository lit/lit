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

import {directive, noChange, Part} from '../lit-html.js';

interface PromisedValue<T = unknown> {
  promise: Promise<T>;
  resolved: boolean;
  value?: T;
}

const promises = new WeakMap<Part, PromisedValue>();

/**
 * Renders a Promise to a Part when it resolves. `defaultContent` will be
 * rendered until the Promise resolves.
 */
export const async = directive((promise: Promise<any>, defaultContent: any = noChange) =>
    (part: Part) => {
      let promisedValue = promises.get(part);

      if (promisedValue !== undefined && promisedValue.promise === promise) {
        // Set the default content if the Promise hasn't resolved *even if
        // we're getting the same Promise* because the default content
        // could have changed.
        if (promisedValue.resolved && defaultContent !== noChange) {
          part.setValue(defaultContent);
        }
        return;
      }

      // The following code only ever runs once per Promise instance
      promisedValue = {promise, resolved: false};
      promises.set(part, promisedValue);
      if (defaultContent !== noChange) {
        part.setValue(defaultContent);
      }

      Promise.resolve(promise).then((value: any) => {
        const currentPromisedValue = promises.get(part);
        if (currentPromisedValue === undefined ||
            currentPromisedValue !== promisedValue) {
          return;
        }
        promisedValue.value = value;
        part.setValue(value);
        part.commit();
      });
    });
