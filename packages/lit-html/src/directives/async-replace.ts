/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ChildPart, noChange} from '../lit-html.js';
import {directive, DirectiveParameters} from '../directive.js';
import {AsyncDirective} from '../async-directive.js';
import {DisconnectableAwaiter} from './disconnectable-awaiter.js';

type Mapper<T> = (v: T, index?: number) => unknown;

export class AsyncReplaceDirective extends AsyncDirective {
  private __iterable!: AsyncIterable<unknown>;
  private __iterator!: AsyncIterator<unknown>;
  protected index = 0;
  private __nextAwaiter?: DisconnectableAwaiter<this, IteratorResult<unknown>>;
  private __mapper?: Mapper<unknown>;

  // @ts-expect-error value not used, but we want a nice parameter for docs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render<T>(value: AsyncIterable<T>, _mapper?: Mapper<T>) {
    return noChange;
  }

  update(_part: ChildPart, [iterable, mapper]: DirectiveParameters<this>) {
    // If we've already set up this particular iterable, we don't need
    // to do anything.
    if (iterable === this.__iterable) {
      return;
    }
    // If we're starting a new promise, stop tracking the last one, since its
    // result is no longer relevant
    this.__nextAwaiter?.disconnect();
    this.__mapper = mapper;
    this.__iterable = iterable;
    this.index = 0;
    // Note, we use the iterator protocol manually (rather than for/await/of),
    // which lets us use the `DisconnectableAwaiter` helper to disconnect &
    // reconnect awaiting the next value from the iterable
    this.__iterator = iterable[Symbol.asyncIterator]();
    this.__awaitNextValue();
    return noChange;
  }

  private __awaitNextValue() {
    this.__nextAwaiter = new DisconnectableAwaiter(
      this.__iterator!.next(),
      this,
      (directive, result) => directive.__commitResult(result)
    );
  }

  private async __commitResult(result: IteratorResult<unknown>) {
    if (result.done) {
      // The iteration is done, so clean up references
      this.__nextAwaiter = undefined;
      return;
    }
    // As a convenience, because functional-programming-style
    // transforms of iterables and async iterables requires a library,
    // we accept a mapper function. This is especially convenient for
    // rendering a template for each item.
    let {value} = result;
    if (this.__mapper !== undefined) {
      value = this.__mapper(value, this.index);
    }
    this.commitValue(value);
    this.index++;
    // Continue and await the next value
    this.__awaitNextValue();
  }

  // Override point for AsyncAppend to append rather than replace
  protected commitValue(value: unknown) {
    this.setValue(value);
  }

  disconnected() {
    this.__nextAwaiter?.disconnect();
  }

  reconnected() {
    this.__nextAwaiter?.reconnect(this);
  }
}

/**
 * A directive that renders the items of an async iterable[1], replacing
 * previous values with new values, so that only one value is ever rendered
 * at a time. This directive may be used in any expression type.
 *
 * Async iterables are objects with a [Symbol.asyncIterator] method, which
 * returns an iterator who's `next()` method returns a Promise. When a new
 * value is available, the Promise resolves and the value is rendered to the
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
export const asyncReplace = directive(AsyncReplaceDirective);
