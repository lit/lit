/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Readable} from 'stream';
import {isIterable, RenderResult} from './render-result.js';

type RenderResultIterator = Iterator<
  string | RenderResult | Promise<string | RenderResult>
>;

/**
 * A Readable that reads from a RenderResult.
 */
export class RenderResultReadable extends Readable {
  private _result: RenderResult;

  /**
   * A stack of open iterators.
   *
   * We need to keep this as instance state because we can pause and resume
   * reading values at any time and can't run guarentee to run iterators to
   * completion in any one loop.
   */
  private _iterators: Array<RenderResultIterator>;

  /**
   * Used to detect race conditions where we might be awaiting for a Promise,
   * but _read() is called separately before the Promise is resolved.
   */
  private _waiting = false;

  constructor(result: RenderResult) {
    super();
    this._result = result;
    this._iterators = [this._result[Symbol.iterator]()];
  }

  override _read(size: number) {
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
    // - `this._read()` should not be called by the underlying Readable until
    //   after this.push() has returned false, so we can wait on a Promise
    //   and call _read() when it resolves to continue without a race condition.
    //   (We try to verify this with the this._waiting field)
    // - `this.push(null)` ends the stream
    //
    // RenderResult is a iterable recursive type that can contain other
    // RenderResults. To accomodate this we keep a stack of open iterators
    // where the last iterator is the most nested value we're reading from.

    if (this._waiting) {
      throw new Error(
        'Race condition in RenderResultReadable: unexpected _read() call'
      );
    }
    // Get the current iterator
    let iterator = this._iterators.pop();

    while (iterator !== undefined) {
      const next = iterator.next();
      if (next.done === true) {
        if (this._iterators.length === 0) {
          // Pushing `null` ends the stream
          this.push(null);
          return;
        } else {
          // Restore the outer iterator
          iterator = this._iterators.pop()!;
          continue;
        }
      }
      const value = next.value as
        | string
        | RenderResult
        | Promise<string | RenderResult>;

      if (typeof value === 'string') {
        const continue_ = this.push(value);
        if (continue_ === false) {
          return;
        }
      } else if (isIterable(value)) {
        // Stash the current iterator so we can retreive it when this new
        // nested iterator is done.
        this._iterators.push(iterator);
        iterator = value[Symbol.iterator]() as RenderResultIterator;
      } else {
        // Must be a Promise
        // Save our current iterator so we can resume on a recursive call to
        // _read() when the Promise resolves.
        this._iterators.push(iterator);
        this._waiting = true;
        value.then(
          (value) => {
            if (typeof value === 'string') {
              const continue_ = this.push(value);
              this._waiting = false;
              if (continue_ !== false) {
                // Continue reading by recursing
                this._read(size);
              }
            }
          },
          (e) => {
            this.emit('error', e);
          }
        );
        // Return now so we don't try to handle new values before the Promise
        // has resovled.
        return;
      }
    }
  }
}
