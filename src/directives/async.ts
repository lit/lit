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

interface PromisedValue {
  promise: Promise<unknown>;
  resolved: boolean;
}

const promises = new WeakMap<Part, PromisedValue>();

/**
 * Renders a Promise to a Part when it resolves. `defaultContent` will be
 * rendered until the Promise resolves.
 */
export const async = directive(
    (promise: Promise<any>,
     defaultContent: unknown = noChange) => (part: Part) => {
      let promisedValue = promises.get(part);

      // The first time we see a value we save and await it
      if (promisedValue === undefined || promisedValue.promise !== promise) {
        promisedValue = {promise, resolved: false};
        promises.set(part, promisedValue);

        Promise.resolve(promise).then((value: unknown) => {
          const currentPromisedValue = promises.get(part);
          promisedValue!.resolved = true;
          if (currentPromisedValue === promisedValue) {
            part.setValue(value);
            part.commit();
          }
        });
      }

      // If the promise has not yet resolved, set/update the defaultContent
      if (!promisedValue.resolved && defaultContent !== noChange) {
        part.setValue(defaultContent);
      }
    });
