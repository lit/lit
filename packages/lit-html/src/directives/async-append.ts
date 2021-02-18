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

import {ChildPart, noChange} from '../lit-html.js';
import {
  directive,
  DirectiveParameters,
  PartInfo,
  PartType,
} from '../directive.js';
import {AsyncDirective} from '../async-directive.js';
import {
  clearPart,
  insertPart,
  setChildPartValue,
} from '../directive-helpers.js';

type Mapper<T> = (v: T, index?: number) => unknown;

class AsyncAppendDirective extends AsyncDirective {
  value?: AsyncIterable<unknown>;
  reconnectResolver?: () => void;
  reconnectPromise?: Promise<void>;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.CHILD) {
      throw new Error('asyncAppend can only be used in child expressions');
    }
  }

  // @ts-expect-error value not used, but we want a nice parameter for docs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render<T>(value: AsyncIterable<T>, _mapper?: Mapper<T>) {
    return noChange;
  }

  update(part: ChildPart, [value, mapper]: DirectiveParameters<this>) {
    // If we've already set up this particular iterable, we don't need
    // to do anything.
    if (value === this.value) {
      return;
    }
    this.value = value;
    this.__iterate(part, mapper);
    return noChange;
  }

  // Separate function to avoid an iffe in update; update can't be async
  // because its return value must be `noChange`
  private async __iterate(part: ChildPart, mapper?: Mapper<unknown>) {
    let i = 0;
    const {value} = this;
    for await (let v of value!) {
      // Check to make sure that value is the still the current value of
      // the part, and if not bail because a new value owns this part
      if (this.value !== value) {
        break;
      }

      // If we were disconnected, pause until reconnected
      if (this.reconnectPromise) {
        await this.reconnectPromise;
      }

      // When we get the first value, clear the part. This lets the
      // previous value display until we can replace it.
      if (i === 0) {
        clearPart(part);
      }
      // As a convenience, because functional-programming-style
      // transforms of iterables and async iterables requires a library,
      // we accept a mapper function. This is especially convenient for
      // rendering a template for each item.
      if (mapper !== undefined) {
        v = mapper(v, i);
      }
      const newPart = insertPart(part);
      setChildPartValue(newPart, v);
      i++;
    }
  }

  disconnected() {
    // Pause iteration while disconnected
    this.reconnectPromise = new Promise(
      (resolve) => (this.reconnectResolver = resolve)
    );
  }

  reconnected() {
    // Resume iteration when reconnected
    this.reconnectPromise = undefined;
    this.reconnectResolver!();
  }
}

/**
 * A directive that renders the items of an async iterable[1], appending new
 * values after previous values, similar to the built-in support for iterables.
 * This directive is usable only in child expressions.
 *
 * Async iterables are objects with a [Symbol.asyncIterator] method, which
 * returns an iterator who's `next()` method returns a Promise. When a new
 * value is available, the Promise resolves and the value is appended to the
 * Part controlled by the directive. If another value other than this
 * directive has been set on the Part, the iterable will no longer be listened
 * to and new values won't be written to the Part.
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
 *
 * @param value An async iterable
 * @param mapper An optional function that maps from (value, index) to another
 *     value. Useful for generating templates for each item in the iterable.
 */
export const asyncAppend = directive(AsyncAppendDirective);
