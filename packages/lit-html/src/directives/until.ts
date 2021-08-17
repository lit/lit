/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Part, noChange} from '../lit-html.js';
import {directive} from '../directive.js';
import {isPrimitive} from '../directive-helpers.js';
import {AsyncDirective} from '../async-directive.js';
import {DisconnectableAwaiter} from './disconnectable-awaiter.js';

const isPromise = (x: unknown) => {
  return !isPrimitive(x) && typeof (x as {then?: unknown}).then === 'function';
};
// Effectively infinity, but a SMI.
const _infinity = 0x3fffffff;

export class UntilDirective extends AsyncDirective {
  private __lastRenderedIndex: number = _infinity;
  private __values: unknown[] = [];
  private __pendingValueToAwaiterMap: Map<
    unknown,
    DisconnectableAwaiter<this>
  > = new Map();

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

      const awaiter = new DisconnectableAwaiter(
        Promise.resolve(value),
        this,
        (directive, result) => directive.__commitResult(value, result)
      );
      this.__pendingValueToAwaiterMap.set(value, awaiter);
    }

    return noChange;
  }

  __commitResult(value: unknown, result: unknown) {
    this.__pendingValueToAwaiterMap.delete(value);
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
    for (const awaiter of this.__pendingValueToAwaiterMap.values()) {
      awaiter.disconnect();
    }
  }

  reconnected() {
    for (const awaiter of this.__pendingValueToAwaiterMap.values()) {
      awaiter.reconnect(this);
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
 *     const content = fetch('./content.txt').then(r => r.text());
 *     html`${until(content, html`<span>Loading...</span>`)}`
 */
export const until = directive(UntilDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
// export type {UntilDirective};
