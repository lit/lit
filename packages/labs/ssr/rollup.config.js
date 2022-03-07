/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const resolve = require('@rollup/plugin-node-resolve').default;

module.exports = {
  input: 'lib/template-parser.js',
  output: {
    file: 'lib/template-parser.cjs',
    format: 'commonjs',
  },
  plugins: [resolve()],
};
