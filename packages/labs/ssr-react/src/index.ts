/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Patches the provided `createElement` function to also server render Lit
 * component's shadow DOM. Has no effect when imported in browser.
 */
export function patchCreateElement<T>(createElement: T) {
  return createElement;
}
