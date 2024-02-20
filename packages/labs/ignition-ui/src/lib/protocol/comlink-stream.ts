/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Importing this module registers a comlink transfer handler for
 * ReadableStream so that they can be passed as values in comlink messages.
 */

import * as comlink from 'comlink';

// Comlink doesn't know that ReadableStream is transferable, so we need to
// provide a transfer handler for it.
// This is also where we'll need to put a ponyfill for transferrable streams for
// Safari support, as they're not supported there yet.
// https://caniuse.com/mdn-api_readablestream_transferable
class TransferHandler
  implements
    comlink.TransferHandler<ReadableStream<unknown>, ReadableStream<unknown>>
{
  canHandle(obj: unknown): obj is ReadableStream<unknown> {
    return obj instanceof ReadableStream;
  }
  serialize(
    stream: ReadableStream<unknown>
  ): [ReadableStream<unknown>, Transferable[]] {
    return [stream, [stream]] as const;
  }
  deserialize(value: ReadableStream<unknown>) {
    return value;
  }
}

comlink.transferHandlers.set('ignition-readablestream', new TransferHandler());

/**
 * This function is a ponyfill of ReadableStream[Symbol.asyncIterator], which
 * is currently only supported in Firefox.
 * https://github.com/whatwg/streams/issues/778#issuecomment-461341033
 */
export async function* streamAsyncIterator<T>(
  stream: ReadableStream<T>,
  options = {preventCancel: false}
): AsyncIterableIterator<T> {
  const reader = stream.getReader();
  try {
    while (true) {
      const result = await reader.read();
      if (result.done === true) {
        return;
      }
      yield result.value;
    }
  } finally {
    // A subtle point about the `yield` statement above is that it will
    // early return from this function (triggering this finally) if the
    // consumer of the iterator itself signals an early return.
    // We call cancel here to let the stream know that the consumer is done
    // with it.
    if (!options.preventCancel) {
      reader.cancel();
    }
    reader.releaseLock();
  }
}
