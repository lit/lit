/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import resolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
  // Note, the commonjs build only bundles private-ssr-support, which is
  // the only module we expect to be used in node by tools that still
  // require to be in commonjs format.
  input: 'private-ssr-support.js',
  output: {
    dir: 'cjs/',
    format: 'commonjs',
    sourcemap: true,
  },
  plugins: [resolve(), sourcemaps()],
};
