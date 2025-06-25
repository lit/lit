/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Currently necessary to allow importing .css files.
 * @see https://github.com/microsoft/TypeScript/issues/46689
 * @see https://github.com/microsoft/TypeScript/issues/46135
 */

declare module '*.css' {
  const sheet: CSSStyleSheet;
  export default sheet;
}
