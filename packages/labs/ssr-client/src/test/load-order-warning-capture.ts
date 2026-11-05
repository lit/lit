/**
 * @license
 * Copyright The Lit Project Contributors.
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Records console.warn calls made while the modules imported after this one
// are evaluated. Call `stopCapture()` to restore console.warn.
export const warnings: string[] = [];
const originalWarn = console.warn;
console.warn = (message: string) => {
  warnings.push(message);
};
export const stopCapture = () => {
  console.warn = originalWarn;
};
