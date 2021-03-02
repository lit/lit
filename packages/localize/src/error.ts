/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * If we throw this error class, we know it was an expected error and can print
 * a concise error instead of a stacktrace.
 */
export class KnownError extends Error {}

/**
 * Fail type checking if the first argument is not `never`, and throw a
 * `KnownError` with the given message if this function is somehow called
 * anyway.
 */
export function throwUnreachable(_x: never, msg: string) {
  throw new KnownError(msg);
}
