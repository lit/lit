/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

const global = globalThis as typeof globalThis & {
  litIssuedWarnings?: Set<string | undefined>;
};
global.litIssuedWarnings ??= new Set();

/**
 * Issue a global warning (once ever, across all instances).
 * Uses Lit's shared `globalThis.litIssuedWarnings` Set.
 */
export function issueWarning(code: string, warning: string): void {
  if (
    !global.litIssuedWarnings!.has(warning) &&
    !global.litIssuedWarnings!.has(code)
  ) {
    console.warn(warning);
    global.litIssuedWarnings!.add(warning);
  }
}

/**
 * Per-instance warning tracker with two dedup strategies:
 * - warnOnce: fire once, never again for this instance
 * - warnOn: fire on each false->true transition of a condition
 */
export class InstanceWarnings {
  private _active = new Set<string>();

  warnOnce(code: string, message: string): void {
    if (!this._active.has(code)) {
      console.warn(message);
      this._active.add(code);
    }
  }

  warnOn(code: string, condition: boolean, message: string): void {
    if (condition) {
      if (!this._active.has(code)) {
        console.warn(message);
        this._active.add(code);
      }
    } else {
      this._active.delete(code);
    }
  }
}
