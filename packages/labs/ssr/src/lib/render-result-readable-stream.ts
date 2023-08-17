/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {ReadableStream as NodeReadableStream} from 'node:stream/web';
import {RenderResult} from './render-result.js';

type RenderResultIterator = Iterator<string | Promise<RenderResult>>;

/**
 * Creates a ReadableStream that reads from a RenderResult.
 */
export const createReadableStream = (result: RenderResult) => {
  let closed = false;

  /**
   * A stack of open iterators.
   *
   * We need to keep this as instance state because we can pause and resume
   * reading values at any time and can't guarantee to run iterators to
   * completion in any one loop.
   */
  const iterators = [result[Symbol.iterator]()];

  return new ReadableStream({
    cancel: () => {
      closed = true;
    },
    pull: async (controller) => {
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
          controller.enqueue(value);
          if (closed) {
            return;
          }
        } else {
          // Must be a Promise
          iterators.push(iterator);
          iterator = (await value)[Symbol.iterator]() as RenderResultIterator;
        }
      }
      controller.close();
    },
  }) as NodeReadableStream;
};
