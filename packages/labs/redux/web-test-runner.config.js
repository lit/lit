/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
// @ts-check

import {playwrightLauncher} from '@web/test-runner-playwright';
import {fromRollup} from '@web/dev-server-rollup';
import rollupReplace from '@rollup/plugin-replace';
const replace = fromRollup(rollupReplace);

/**
 * @type {import('@web/test-runner').TestRunnerConfig}
 */
const config = {
  rootDir: '.',
  files: ['./test/**/*_test.js'],
  nodeResolve: true,
  preserveSymlinks: true,
  browsers: [
    playwrightLauncher({product: 'chromium'}),
    playwrightLauncher({product: 'firefox'}),
    playwrightLauncher({product: 'webkit'}),
  ],
  testFramework: {
    // https://mochajs.org/api/mocha
    config: {
      ui: 'tdd',
      timeout: '60000',
    },
  },
  plugins: [
    // TODO(augustjk) Remove ts-ignore when we can sort out version conflicts.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore innocuous type error due to `@web/dev-server-core` conflict
    replace({
      preventAssignment: false,
      // Needed for immer.js used by Redux Toolkit.
      // See https://github.com/immerjs/immer/issues/557
      'process.env.NODE_ENV': JSON.stringify(
        process.env.MODE === 'prod' ? 'production' : 'development'
      ),
    }),
  ],
};

export default config;
