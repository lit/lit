/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Readable} from 'stream';
import {RenderResult} from './render-result.js';
import {ThunkedRenderResult, Thunk} from './render-result.js';

type RenderResultIterator = Iterator<string | Thunk | Promise<RenderResult>>;

/**
 * A Readable that reads from a RenderResult.
 */
export class RenderResultReadable extends Readable {
  /**
   * A stack of open iterators.
   *
   * We need to keep this as instance state because we can pause and resume
   * reading values at any time and can't guarantee to run iterators to
   * completion in any one loop.
   */
  private _iterators: Array<RenderResultIterator>;
  private _currentIterator?: RenderResultIterator;

  /**
   * `_waiting` flag is used to prevent multiple concurrent reads.
   *
   * RenderResultReadable handles async RenderResult's, and must await them.
   * While awaiting a result, it's possible for `_read` to be called again.
   * Without this flag, a new read is initiated and the order of the data in the
   * stream becomes inconsistent.
   */
  private _waiting = false;

  constructor(result: RenderResult | ThunkedRenderResult) {
    super();
    this._iterators = [result[Symbol.iterator]()];
  }

  override async _read(_size: number) {
    if (this._waiting) {
      return;
    }
    // This implementation reads values from the RenderResult and pushes them
    // into the base class's Readable implementation. It tries to be as
    // efficient as possible, which means:
    //   1. Avoid microtasks and Promise allocations. Read and write values
    //      synchronously when possible.
    //   2. Write as many values to the Readable per call to _read() as
    //      possible.
    //
    // To do this correctly we must adhere to the Readable contract for
    // _read(), which states that:
    //
    // - The size parameter can be safely ignored
    // - _read() should call `this.push()` as many times as it can until
    //   `this.push()` returns false, which means the underlying Readable
    //   does not want any more values.
    // - `this.push(null)` ends the stream
    //
    // This means that we cannot use for/of loops to iterate on the render
    // result, because we must be able to return in the middle of the loop
    // and resume on the next call to _read().

    // Get the current iterator, only if we don't already have one from the
    // previous call to _read()
    this._currentIterator ??= this._iterators.pop();

    while (this._currentIterator !== undefined) {
      const next = this._currentIterator.next();
      if (next.done === true) {
        // Restore the outer iterator
        this._currentIterator = this._iterators.pop();
        continue;
      }

      let value:
        | string
        | Thunk
        | Promise<string | RenderResult | ThunkedRenderResult>
        | RenderResult
        | ReturnType<Thunk> = next.value;

      // This inner loop lets us repeatedly resolve thunks and Promises
      // until we get to a string, array, or iterator.
      while (value !== undefined) {
        // Trampoline in case of nested thunks
        while (typeof value === 'function') {
          value = value();
        }

        if (value === undefined) {
          // Just continue to the next value from the iterator
          break;
        }

        if (typeof value === 'string') {
          if (this.push(value) === false) {
            // Backpressure: The consumer doesn't want any more values. Return
            // for now and we may get a new call to _read()
            return;
          }
          break;
        }

        if (
          Array.isArray(value) ||
          typeof (value as unknown as RenderResult)[Symbol.iterator] ===
            'function'
        ) {
          // If it's an array or iterable, iterate over it by pushing the
          // current iterator on the stack and making the new one current. The
          // next loop of the outer while() will call next() on it.
          this._iterators.push(this._currentIterator);
          this._currentIterator = (value as RenderResult)[Symbol.iterator]();
          break;
        } else {
          // Must be a Promise. Await it can continue the inner loop to handle
          // whatever it resolves to.
          if (typeof (value as Promise<unknown>).then !== 'function') {
            throw new Error(
              `Unexpected value in RenderResult: ${value} (${typeof value})`
            );
          }
          this._waiting = true;
          value = await value;
          this._waiting = false;
        }
      }
    }
    // Pushing `null` ends the stream
    this.push(null);
  }
}
