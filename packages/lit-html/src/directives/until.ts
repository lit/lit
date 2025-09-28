/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Part, noChange} from '../lit-html.js';
import {isPrimitive} from '../directive-helpers.js';
import {
  directive,
  AsyncDirective,
  DirectiveResult,
} from '../async-directive.js';
import {Pauser, PseudoWeakRef} from './private-async-helpers.js';

const isPromise = (x: unknown): x is Promise<unknown> => {
  return !isPrimitive(x) && typeof (x as {then?: unknown}).then === 'function';
};
// Effectively infinity, but a SMI.
const _infinity = 0x3fffffff;

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export class UntilDirective<T> extends AsyncDirective {
  private __lastRenderedIndex: number = _infinity;
  private __values: unknown[] = [];
  private __weakThis = new PseudoWeakRef(this);
  private __pauser = new Pauser();

  render(...args: Array<T>): UnwrapPromise<T> {
    return (args.find((x) => !isPromise(x)) ?? noChange) as UnwrapPromise<T>;
  }

  override update(_part: Part, args: Array<unknown>) {
    const previousValues = this.__values;
    let previousLength = previousValues.length;
    this.__values = args;

    const weakThis = this.__weakThis;
    const pauser = this.__pauser;

    // If our initial render occurs while disconnected, ensure that the pauser
    // and weakThis are in the disconnected state
    if (!this.isConnected) {
      this.disconnected();
    }

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

      // Note, the callback avoids closing over `this` so that the directive
      // can be gc'ed before the promise resolves; instead `this` is retrieved
      // from `weakThis`, which can break the hard reference in the closure when
      // the directive disconnects
      Promise.resolve(value).then(async (result: unknown) => {
        // If we're disconnected, wait until we're (maybe) reconnected
        // The while loop here handles the case that the connection state
        // thrashes, causing the pauser to resume and then get re-paused
        while (pauser.get()) {
          await pauser.get();
        }
        // If the callback gets here and there is no `this`, it means that the
        // directive has been disconnected and garbage collected and we don't
        // need to do anything else
        const _this = weakThis.deref();
        if (_this !== undefined) {
          const index = _this.__values.indexOf(value);
          // If state.values doesn't contain the value, we've re-rendered without
          // the value, so don't render it. Then, only render if the value is
          // higher-priority than what's already been rendered.
          if (index > -1 && index < _this.__lastRenderedIndex) {
            _this.__lastRenderedIndex = index;
            _this.setValue(result);
          }
        }
      });
    }

    return noChange;
  }

  override disconnected() {
    this.__weakThis.disconnect();
    this.__pauser.pause();
  }

  override reconnected() {
    this.__weakThis.reconnect(this);
    this.__pauser.resume();
  }
}

interface Until {
  <T extends Array<unknown>>(
    ...args: T
  ): DirectiveResult<typeof UntilDirective<T[number]>>;
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
export const until: Until = directive(UntilDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
// export type {UntilDirective};
