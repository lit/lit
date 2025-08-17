/**
 * @license
 * Copyright 2025 Google LLC
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
  let waiting = false;
  let currentIterator;
  const encoder = new TextEncoder();

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
      if (waiting) {
        return;
      }

      // Get the current iterator, only if we don't already have one from the
      currentIterator ??= iterators.pop();

      while (currentIterator !== undefined) {
        const next = currentIterator.next();
        if (next.done === true) {
          // Restore the outer iterator
          currentIterator = iterators.pop();
          continue;
        }

        const value = next.value;

        if (typeof value === 'string') {
          controller.enqueue(encoder.encode(value));
          if (closed) {
            return;
          }
        } else {
          // Must be a Promise
          iterators.push(currentIterator);
          waiting = true;
          currentIterator = (await value)[
            Symbol.iterator
          ]() as RenderResultIterator;
          waiting = false;
        }
      }
      controller.close();
    },
  }) as NodeReadableStream;
};
