/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export enum DiagnosticCode {
  /**
   * This is the default error code and doesn't indicate any specific error.
   */
  UNKNOWN = 548000, // The letters L-I-T are on digits 5-4-8 on a phone keypad.

  /**
   * This code represents a situation where the type of a property name is not
   * supported in the given context. For example, when a symbol is used to name
   * a property where the analyzer only supports plain identifiers.
   */
  UNSUPPORTED_PROPERTY_NAME_TYPE = 548001,
}
