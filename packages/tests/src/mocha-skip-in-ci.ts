/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview Shared web-test-runner helpers that add a `.skipInCI`
 * variant to Mocha's `suite`/`test` (tdd) and `describe`/`it` (bdd) UI
 * globals. Tests marked with `.skipInCI` run normally during local
 * development but are skipped when `process.env.CI` is truthy.
 *
 * Consumers pass {@link mochaSkipInCITestRunnerHtml} as the
 * `testRunnerHtml` option of their web-test-runner config. The helper
 * returns the standard WTR runner page with a small setup script that
 * augments the Mocha UI globals before test files register.
 *
 * Works across all browsers supported by `@web/test-runner-playwright`
 * (Chromium, Firefox, Webkit) and `@web/test-runner-chrome`.
 */

/**
 * A `testRunnerHtml` callback for web-test-runner that returns the
 * standard test-framework page augmented with `.skipInCI` helpers on
 * Mocha's UI globals. CI mode is detected from `process.env.CI`.
 */
export function mochaSkipInCITestRunnerHtml(
  testFrameworkImport: string
): string {
  const isCI = !!process.env.CI;
  return `<!DOCTYPE html>
<html>
  <head>
    <script>
      window.__LIT_TESTS_IS_CI__ = ${JSON.stringify(isCI)};
    </script>
    <script type="module">
      // Augment Mocha's UI globals with \`.skipInCI\`. The test framework
      // module (see below) sets up Mocha synchronously as it loads and
      // then dynamically imports user test files after the \`load\`
      // event, so waiting for \`load\` here ensures both that Mocha
      // globals exist and that \`.skipInCI\` is defined before test
      // files register.
      addEventListener('load', () => {
        const isCI = window.__LIT_TESTS_IS_CI__ === true;
        for (const name of ['suite', 'test', 'describe', 'it']) {
          const fn = globalThis[name];
          if (
            typeof fn === 'function' &&
            typeof fn.skip === 'function' &&
            !fn.skipInCI
          ) {
            fn.skipInCI = (title, body) =>
              isCI ? fn.skip(title, body) : fn(title, body);
          }
        }
      });
    </script>
  </head>
  <body>
    <script type="module" src="${testFrameworkImport}"></script>
  </body>
</html>`;
}
