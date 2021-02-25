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

import {Part, noChange} from '../lit-html.js';
import {directive} from '../directive.js';
import {isPrimitive} from '../directive-helpers.js';
import {AsyncDirective} from '../async-directive.js';

const isPromise = (x: unknown) => {
  return !isPrimitive(x) && typeof (x as {then?: unknown}).then === 'function';
};
// Effectively infinity, but a SMI.
const _infinity = 0x7fffffff;

class UntilDirectiveClass extends AsyncDirective {
  private lastRenderedIndex: number = _infinity;
  private values: unknown[] = [];

  render(...args: Array<unknown>) {
    return args.find((x) => !isPromise(x)) ?? noChange;
  }

  update(_part: Part, args: Array<unknown>) {
    const previousValues = this.values;
    let previousLength = previousValues.length;
    this.values = args;

    for (let i = 0; i < args.length; i++) {
      // If we've rendered a higher-priority value already, stop.
      if (i > this.lastRenderedIndex) {
        break;
      }

      const value = args[i];

      // Render non-Promise values immediately
      if (!isPromise(value)) {
        this.lastRenderedIndex = i;
        // Since a lower-priority value will never overwrite a higher-priority
        // synchronous value, we can stop processing now.
        return value;
      }

      // If this is a Promise we've already handled, skip it.
      if (i < previousLength && value === previousValues[i]) {
        continue;
      }

      // We have a Promise that we haven't seen before, so priorities may have
      // changed. Forget what we rendered before.
      this.lastRenderedIndex = _infinity;
      previousLength = 0;

      Promise.resolve(value).then((resolvedValue: unknown) => {
        const index = this.values.indexOf(value);
        // If state.values doesn't contain the value, we've re-rendered without
        // the value, so don't render it. Then, only render if the value is
        // higher-priority than what's already been rendered.
        if (index > -1 && index < this.lastRenderedIndex) {
          this.lastRenderedIndex = index;
          this.setValue(resolvedValue);
        }
      });
    }

    return noChange;
  }
}

/**
 * Renders one of a series of values, including Promises, to a Part.
 *
 * Values are rendered in priority order, with the first argument having the
 * highest priority and the last argument having the lowest priority. If a
 * value is a Promise, low-priority values will be rendered until it resolves.
 *
 * The priority of values can be used to create placeholder content for async
 * data. For example, a Promise with pending content can be the first,
 * highest-priority, argument, and a non_promise loading indicator template can
 * be used as the second, lower-priority, argument. The loading indicator will
 * render immediately, and the primary content will render when the Promise
 * resolves.
 *
 * Example:
 *
 *     const content = fetch('./content.txt').then(r => r.text());
 *     html`${until(content, html`<span>Loading...</span>`)}`
 */
export const until = directive(UntilDirectiveClass);

export type {UntilDirectiveClass};
