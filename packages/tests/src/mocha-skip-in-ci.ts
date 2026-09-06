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
 * returns the standard WTR runner page with a classic inline script
 * that installs intercepting `Object.defineProperty` getters on `window`
 * for Mocha's UI names. The interceptors augment the stored function
 * with `.skipInCI` lazily the first time it's read, so the augmentation
 * is in place no matter how the test framework orders Mocha setup vs.
 * test-file loading across Chromium, Firefox, and Webkit.
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
      // Install \`.skipInCI\` on Mocha's UI globals (\`suite\`, \`test\`,
      // \`describe\`, \`it\`) as soon as the test framework assigns them.
      // Uses interceptor properties on \`window\` so the augmentation is
      // ready before any test file registers, independent of browser
      // timing for module/load events. Runs as a classic script before
      // any module script, so it executes synchronously during parse.
      (function () {
        var isCI = ${JSON.stringify(isCI)};
        function augment(fn) {
          if (
            typeof fn === 'function' &&
            typeof fn.skip === 'function' &&
            !fn.skipInCI
          ) {
            fn.skipInCI = function (title, body) {
              return isCI ? fn.skip(title, body) : fn(title, body);
            };
          }
          return fn;
        }
        ['suite', 'test', 'describe', 'it'].forEach(function (name) {
          var stored = window[name];
          Object.defineProperty(window, name, {
            configurable: true,
            get: function () {
              return augment(stored);
            },
            set: function (v) {
              stored = v;
            },
          });
        });
      })();
    </script>
  </head>
  <body>
    <script type="module" src="${testFrameworkImport}"></script>
  </body>
</html>`;
}
