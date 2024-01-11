/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Wraps the provided `createElement` function to also server render Lit
 * component's shadow DOM. Has no effect when imported in browser.
 */
export function wrapCreateElement<T>(createElement: T) {
  return createElement;
}
