/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Type augmentations for the `.skipInCI` helper added to Mocha's UI
 * globals by `packages/tests/mocha-skip-in-ci.js` (wired through the
 * shared `testRunnerHtml` in `packages/tests`).
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
