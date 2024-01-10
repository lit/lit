/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This rollup config performs the minimum transforms needed to build
// a package that imports React from esm module source:
// - Handles imports to commonjs modules, since react is only distributed
//   as commonjs
// - Replaces process.env.NODE_ENV

import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
export default {
  input: ['js/tests/tests.js'],
  output: {
    dir: './tests',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    nodeResolve({
      extensions: ['.js'],
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    commonjs(),
  ],
};
