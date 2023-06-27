/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * If we throw this error class, we know it was an expected error and can print
 * a concise error instead of a stacktrace.
 */
export class KnownError extends Error {}
