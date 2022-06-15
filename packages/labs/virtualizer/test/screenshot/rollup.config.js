/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import resolve from 'rollup-plugin-node-resolve';
const { readdirSync } = require('fs')

const builds = [];

// Create a build for each page in cases/.
const pages = readdirSync('./cases/');
for (let name of pages) {
  builds.push({
    input: `cases/${name}/main.js`,
    output: {
      dir: `cases/${name}/build`,
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]
  });
}

export default builds;
