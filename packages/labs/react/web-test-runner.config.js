/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {playwrightLauncher} from '@web/test-runner-playwright';
import {rollupBundlePlugin} from '@web/dev-server-rollup';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  rootDir: '.',
  nodeResolve: true,
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
    // Bundle test entrypoints for React.
    rollupBundlePlugin({
      rollupConfig: {
        input: [
          'development/test/create-component_test.js',
          'development/test/use-controller_test.js',
        ],
        plugins: [
          commonjs(),
          nodeResolve(),
          replace({
            preventAssignment: false,
            'process.env.NODE_ENV': JSON.stringify('development'),
          }),
        ],
        onwarn(warning, warn) {
          // Suppress warning due to TS output's `this && this.__decorate`.
          if (warning.code === 'THIS_IS_UNDEFINED') return;
          warn(warning);
        },
      },
    }),
  ],
};
