/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Ambient type augmentations for the `.skipInCI` helper installed on
 * Mocha's UI globals by `packages/tests/src/mocha-skip-in-ci.ts` (wired
 * through the shared `testRunnerHtml` in `packages/tests`).
 *
 * Consumer packages pick up these augmentations by adding this file to
 * their tsconfig's `files` array, e.g.:
 *
 *   "files": ["../../tests/mocha-extensions.d.ts"]
 */
declare module 'mocha' {
  interface SuiteFunction {
    skipInCI(title: string, fn?: (this: Mocha.Suite) => void): Mocha.Suite;
  }
  interface TestFunction {
    skipInCI(title: string, fn?: Mocha.Func | Mocha.AsyncFunc): Mocha.Test;
  }
}

export {};
