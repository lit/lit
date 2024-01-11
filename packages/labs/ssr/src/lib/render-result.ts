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
 * Joins a RenderResult into a string
 */
export const collectResult = async (result: RenderResult): Promise<string> => {
  let value = '';
  for (const chunk of result) {
    value +=
      typeof chunk === 'string' ? chunk : await collectResult(await chunk);
  }
  return value;
};

/**
 * Joins a RenderResult into a string synchronously.
 *
 * This function throws if a RenderResult contains a Promise.
 */
export const collectResultSync = (result: RenderResult): string => {
  let value = '';
  for (const chunk of result) {
    if (typeof chunk === 'string') {
      value += chunk;
    } else {
      throw new Error(
        'Promises not supported in collectResultSync. ' +
          'Please use collectResult.'
      );
    }
  }
  return value;
};
