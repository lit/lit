/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Readable} from 'stream';

type MaybeAsyncIterable<T> = Iterable<T | Promise<MaybeAsyncIterable<T>>>;

async function* withAsync(
  iterable: MaybeAsyncIterable<string>
): AsyncIterable<string> {
  for (const value of iterable) {
    if (
      typeof (value as Promise<MaybeAsyncIterable<string>>)?.then === 'function'
    ) {
      yield* withAsync(await (value as Promise<MaybeAsyncIterable<string>>));
    } else {
      yield value as string;
    }
  }
}

export const readableFrom = (
  ssrResult: Iterable<string>,
  handleAsync = false
) => {
  return Readable.from(handleAsync ? withAsync(ssrResult) : ssrResult);
};
