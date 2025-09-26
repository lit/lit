/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * A rendered value as an iterable of strings or Promises of a RenderResult.
 *
 * This type is a synchronous Iterable so that consumers do not have to await
 * every value according to the JS asynchronous iterator protocol, which would
 * cause additional overhead compared to a sync iterator.
 *
 * Consumers should check the type of each value emitted by the iterator, and
 * if it is a Promise await it if possible, or throw an error.
 *
 * The utility functions {@link collectRenderResult} and
 * {@link collectRenderResultSync} do this for you.
 */
export type RenderResult = Iterable<string | Promise<RenderResult>>;

/**
 * A thunk is a function that when called returns either:
 * - A string
 * - An array of strings and/or thunks
 * - A Promise of the above
 */
export type Thunk = () =>
  | void
  | string
  | ThunkedRenderResult
  | Promise<string | ThunkedRenderResult>;

/**
 * A rendered value as an array of strings or thunks.
 *
 * This type allows for synchronous iteration while supporting both sync and
 * async rendering. Strings can be emitted immediately, while thunks must be
 * called to produce their values. Thunks can return Promises for asynchronous
 * rendering.
 *
 * The utility functions {@link collectResult} and {@link collectResultSync}
 * handle the iteration and thunk calling for you.
 */
export type ThunkedRenderResult = Array<string | Thunk>;

/**
 * Joins a RenderResult or ThunkedRenderResult into a string.
 */
export const collectResult = async (
  result: RenderResult | ThunkedRenderResult
): Promise<string> => {
  let str = '';
  for (const chunk of result) {
    let value:
      | void
      | string
      | Promise<RenderResult | ThunkedRenderResult>
      | Thunk
      | ThunkedRenderResult = chunk;

    while (typeof value === 'function') {
      value = value();
    }

    if (typeof value === 'string') {
      str += value;
    } else if (Array.isArray(value)) {
      str += await collectResult(value);
    } else if (value !== undefined) {
      str += await collectResult(await value);
    }
  }

  return str;
};

/**
 * Joins a RenderResult or ThunkedRenderResult into a string synchronously.
 *
 * This function throws if a RenderResult contains a Promise.
 */
export const collectResultSync = (
  result: RenderResult | ThunkedRenderResult
): string => {
  let str = '';
  for (const chunk of result) {
    let value:
      | void
      | string
      | Promise<RenderResult | ThunkedRenderResult>
      | Thunk
      | ThunkedRenderResult = chunk;

    while (typeof value === 'function') {
      value = value();
    }

    if (typeof value === 'string') {
      str += value;
    } else if (Array.isArray(value)) {
      str += collectResultSync(value);
    } else if (value !== undefined) {
      throw new Error(
        'Promises not supported in collectResultSync. ' +
          'Please use collectResult.'
      );
    }
  }

  return str;
};
