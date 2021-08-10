/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Part, noChange} from '../lit-html.js';
import {directive} from '../directive.js';
import {isPrimitive} from '../directive-helpers.js';
import {AsyncDirective} from '../async-directive.js';

// When a directive is connected and actively awaiting a result from a promise,
// the directive will be stored in `promiseToDirectiveMap`. The resolver will
// get a reference back to the directive to perform the commit via the WeakMap
// rather than closing over the directive instance, which would hold the
// directive until the promise resolved.
const promiseToDirectiveMap: WeakMap<Promise<unknown>, UntilDirective> =
  new WeakMap();

// When a directive is disconnected and an awaited promise resolves, the
// result will be stored in `promiseToResultMap` such that it can be retrieved
// if/when it reconnects
const promiseToResultMap: WeakMap<Promise<unknown>, unknown> = new WeakMap();

const isPromise = (x: unknown) => {
  return !isPrimitive(x) && typeof (x as {then?: unknown}).then === 'function';
};
// Effectively infinity, but a SMI.
const _infinity = 0x7fffffff;

export class UntilDirective extends AsyncDirective {
  private __lastRenderedIndex: number = _infinity;
  private __values: unknown[] = [];
  private __pendingValueToPromiseMap: Map<unknown, Promise<unknown>> =
    new Map();

  render(...args: Array<unknown>) {
    return args.find((x) => !isPromise(x)) ?? noChange;
  }

  update(_part: Part, args: Array<unknown>) {
    const previousValues = this.__values;
    let previousLength = previousValues.length;
    this.__values = args;

    for (let i = 0; i < args.length; i++) {
      // If we've rendered a higher-priority value already, stop.
      if (i > this.__lastRenderedIndex) {
        break;
      }

      const value = args[i];

      // Render non-Promise values immediately
      if (!isPromise(value)) {
        this.__lastRenderedIndex = i;
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
      this.__lastRenderedIndex = _infinity;
      previousLength = 0;

      const promise = Promise.resolve(value);
      this.__pendingValueToPromiseMap.set(value, promise);
      if (this.isConnected) {
        // We still await the promise even when disconnected (since if the
        // directive reconnects it will need to handle the result), but only
        // associate the directive to the promise when connected
        promiseToDirectiveMap.set(promise, this);
      }
      promise.then((result) => {
        const directive = promiseToDirectiveMap.get(promise);
        if (directive === undefined) {
          // The directive was disconnected, so weakly hold onto the result
          // in case the directive reconnects
          promiseToResultMap.set(promise, result);
        } else {
          promiseToDirectiveMap.delete(promise);
          directive.__commitResult(value, result);
        }
      });
    }

    return noChange;
  }

  __commitResult(value: unknown, result: unknown) {
    this.__pendingValueToPromiseMap.delete(value);
    const index = this.__values.indexOf(value);
    // If state.values doesn't contain the value, we've re-rendered without
    // the value, so don't render it. Then, only render if the value is
    // higher-priority than what's already been rendered.
    if (index > -1 && index < this.__lastRenderedIndex) {
      this.__lastRenderedIndex = index;
      this.setValue(result);
    }
  }

  disconnected() {
    // Clearing the refrence from the promises to the directive allows the
    // directive (and all the DOM associated with it) to be gc'ed even if the
    // promise hasn't resolved
    for (const promise of this.__pendingValueToPromiseMap.values()) {
      promiseToDirectiveMap.delete(promise);
    }
  }

  reconnected() {
    for (const [value, promise] of this.__pendingValueToPromiseMap) {
      const result = promiseToResultMap.get(promise);
      if (result !== undefined) {
        // The next result resolved while we were disconnected; commit it and
        // continue
        this.__commitResult(value, result);
      } else {
        // The next result is still pending, so reassociate this directive with
        // the promise
        promiseToDirectiveMap.set(promise, this);
      }
    }
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
 * ```js
 * const content = fetch('./content.txt').then(r => r.text());
 * html`${until(content, html`<span>Loading...</span>`)}`
 * ```
 */
export const until = directive(UntilDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
// export type {UntilDirective};
