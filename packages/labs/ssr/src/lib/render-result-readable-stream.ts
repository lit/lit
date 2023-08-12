/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {RenderResult} from './render-result.js';

type RenderResultIterator = Iterator<string | Promise<RenderResult>>;

/**
 * A Readable that reads from a RenderResult.
 */
export const renderResultReadableStream = (result: RenderResult) => {
  let closed = false;

  /**
   * A stack of open iterators.
   *
   * We need to keep this as instance state because we can pause and resume
   * reading values at any time and can't guarantee to run iterators to
   * completion in any one loop.
   */
  const iterators = [result[Symbol.iterator]()];

  const encoder = new TextEncoder();

  return new ReadableStream({
    cancel: () => void (closed = true),
    pull: async (controller) => {
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
      // This means that we cannot use for/of loops to iterate on the render
      // result, because we must be able to return in the middle of the loop
      // and resume on the next call to _read().

      // Get the current iterator
      let iterator = iterators.pop();

      while (iterator !== undefined) {
        const next = iterator.next();
        if (next.done === true) {
          // Restore the outer iterator
          iterator = iterators.pop();
          continue;
        }

        const value = next.value;

        if (typeof value === 'string') {
          controller.enqueue(encoder.encode(value));
          if (closed) return;
        } else {
          // Must be a Promise
          iterators.push(iterator);
          iterator = (await value)[Symbol.iterator]() as RenderResultIterator;
        }
      }
      controller.close();
    },
  });
};
