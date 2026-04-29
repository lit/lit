/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export const DiagnosticCode = {
  /**
   * This is the default error code and doesn't indicate any specific error.
   *
   * We start numbering from 548000 to avoid collisions with other projects.
   */
  UNKNOWN: 548000, // The letters L-I-T are on digits 5-4-8 on a phone keypad.

  /**
   * This code represents a situation where ordinary and otherwise-valid code
   * is not yet supported in the Lit analyzer. We should aim to remove uses of
   * this code.
   */
  UNSUPPORTED: 548001,
} as const;

// This lets the `DiagnosticCode` type act as an enum by extracting a union of
// the value types of the `DiagnosticCode` object's properties.
//
// https://www.typescriptlang.org/docs/handbook/enums.html#objects-vs-enums
export type DiagnosticCode =
  (typeof DiagnosticCode)[keyof typeof DiagnosticCode];
