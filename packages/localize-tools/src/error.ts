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
 * Fail type checking if the first argument is not `never` and return the
 * argument.
 */
export function unreachable(x: never) {
  return x;
}
