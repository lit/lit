/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * A rendered value as an iteratble of strings or Promises of string, or a
 * nested RenderResult.
 *
 * This type is a synchronous Iterable so that consumers do not have to await
 * every value according to the JS asynchronous iterator protocol, which would
 * cause additional overhead compared to a sync iterator.
 *
 * Consumers should check the type of each value emitted by the iterator, and
 * it is a Promise await it if possible, or throw an error.
 *
 * The utility functions `collectRenderResult` and `collectRenderResultSync`
 * do this for you.
 */
export type RenderResult = Iterable<
  string | RenderResult | Promise<string | RenderResult>
>;

/**
 * Joins a RenderResult into a string
 */
export const collectResult = async (
  result: RenderResult,
  initialValue = ''
) => {
  let value = initialValue;
  for (let chunk of result) {
    if (typeof chunk === 'string') {
      // Check for strings first because they are the common case and should be
      // handled as fast as possible. Also because strings are iterable
      value += chunk;
    } else if (isIterable(chunk)) {
      // TODO (justinfagnani): if we keep a stack of iterables we can reduce
      // the number of `await`s by only awaiting Promises and not having
      // to await recursive calls.
      value = await collectResult(chunk as RenderResult, value);
    } else {
      // Must be a Promise
      chunk = await chunk;
      if (typeof chunk === 'string') {
        value += chunk;
      } else {
        value += await collectResult(chunk as RenderResult, value);
      }
    }
  }
  return value;
};

/**
 * Joins a RenderResult into a string synchronously.
 *
 * This function throws if a RenderResult contains a Promise.
 */
export const collectResultSync = (result: RenderResult, initialValue = '') => {
  let value = initialValue;
  for (const chunk of result) {
    if (typeof chunk === 'string') {
      value += chunk;
    } else if (isIterable(chunk)) {
      value = collectResultSync(chunk as RenderResult, value);
    } else {
      throw new Error(
        'Promises not supported in collectResultSync. ' +
          'Please use collectResult.'
      );
    }
  }
  return value;
};

const isIterable = (v: unknown): v is IterableIterator<unknown> =>
  typeof (v as IterableIterator<unknown>)[Symbol.iterator] === 'function';
