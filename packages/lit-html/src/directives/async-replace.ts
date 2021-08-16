/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ChildPart, noChange} from '../lit-html.js';
import {directive, DirectiveParameters} from '../directive.js';
import {AsyncDirective} from '../async-directive.js';

type Mapper<T> = (v: T, index?: number) => unknown;

// When a directive is connected and actively awaiting a result from a promise,
// the directive will be stored in `promiseToDirectiveMap`. The resolver will
// get a reference back to the directive to perform the commit via the WeakMap
// rather than closing over the directive instance, which would hold the
// directive until the promise resolved.
const promiseToDirectiveMap: WeakMap<Promise<unknown>, AsyncReplaceDirective> =
  new WeakMap();

// When a directive is disconnected and an awaited promise resolves, the
// result will be stored in `promiseToResultMap` such that it can be retrieved
// if/when it reconnects
const promiseToResultMap: WeakMap<Promise<unknown>, IteratorResult<unknown>> =
  new WeakMap();

export class AsyncReplaceDirective extends AsyncDirective {
  private __iterable!: AsyncIterable<unknown>;
  private __iterator!: AsyncIterator<unknown>;
  protected index = 0;
  private __nextPromise?: Promise<IteratorResult<unknown>>;
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
    if (this.__nextPromise !== undefined) {
      promiseToDirectiveMap.delete(this.__nextPromise);
    }
    this.__mapper = mapper;
    this.__iterable = iterable;
    this.index = 0;
    // Note, we use the iterator protocol manually (rather than for/await/of) so
    // that we can break the reference between the next promise and the directive
    // when the directive disconnects, and be able to resume iteration if the
    // directive reconnects. The only way to stop iteration and allow the
    // directive (and all its DOM) to be gc'ed via for/await/of would be to break
    // out of the loop, which precludes resuming the iteration if/when the
    // directive is reconnected.
    this.__iterator = iterable[Symbol.asyncIterator]();
    this.__awaitNextValue();
    return noChange;
  }

  private __awaitNextValue() {
    const nextPromise = (this.__nextPromise = this.__iterator!.next());
    if (this.isConnected) {
      // We still await the nextPromise even when disconnected (since if the
      // directive reconnects it will need to handle the result), but only
      // associate the directive to the promise when connected
      promiseToDirectiveMap.set(nextPromise, this);
    }
    nextPromise.then((result) => {
      const directive = promiseToDirectiveMap.get(nextPromise);
      if (directive === undefined) {
        // The directive was disconnected, so weakly hold onto the result
        // in case the directive reconnects
        promiseToResultMap.set(nextPromise, result);
      } else {
        promiseToDirectiveMap.delete(nextPromise);
        directive.__commitResult(result);
      }
    });
  }

  private async __commitResult(result: IteratorResult<unknown>) {
    if (result.done) {
      // The iteration is done, so clean up references
      this.__nextPromise = undefined;
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
    if (this.__nextPromise) {
      // Clearing the refrence from the promises to the directive allows the
      // directive (and all the DOM associated with it) to be gc'ed even if the
      // promise hasn't resolved
      promiseToDirectiveMap.delete(this.__nextPromise);
    }
  }

  reconnected() {
    if (this.__nextPromise) {
      const result = promiseToResultMap.get(this.__nextPromise);
      if (result !== undefined) {
        // The next result resolved while we were disconnected; commit it and
        // continue
        this.__commitResult(result);
      } else {
        // The next result is still pending, so reassociate this directive with
        // the promise
        promiseToDirectiveMap.set(this.__nextPromise, this);
      }
    }
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
