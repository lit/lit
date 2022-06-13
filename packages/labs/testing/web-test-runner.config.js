/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
// @ts-check

import {playwrightLauncher} from '@web/test-runner-playwright';
import {litSsrPlugin} from './lib/lit-ssr-plugin.js';

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
  plugins: [litSsrPlugin()],
};

export default config;
