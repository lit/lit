/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Readable} from 'stream';
import {RenderResult} from './render-result.js';

type RenderResultIterator = Iterator<string | Promise<RenderResult>>;

/**
 * A Readable that reads from a RenderResult.
 */
export class RenderResultReadable extends Readable {
  private _result: RenderResult;

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

  constructor(result: RenderResult) {
    super();
    this._result = result;
    this._iterators = [this._result[Symbol.iterator]()];
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

      const value = next.value;

      if (typeof value === 'string') {
        if (this.push(value) === false) {
          // The consumer doesn't want any more values. Return for now and
          // we may get a new call to _read()
          return;
        }
      } else {
        // Must be a Promise
        this._iterators.push(this._currentIterator);
        this._waiting = true;
        this._currentIterator = (await value)[
          Symbol.iterator
        ]() as RenderResultIterator;
        this._waiting = false;
      }
    }
    // Pushing `null` ends the stream
    this.push(null);
  }
}
