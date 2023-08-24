/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {compileLitTemplates} from '@lit-labs/compiler';
import typescript from '@rollup/plugin-typescript';

/**
 * An example config using @rollup/plugin-typescript to apply the template
 * optimization transform.
 *
 * This config is used to test that transformed files maintain sensible source
 * maps.
 */
export default {
  input: ['./test_files/source_map_tests/basic.ts'],
  output: {
    dir: './test_files/source_map_tests',
    format: 'esm',
    sourcemap: true,
    preserveModules: true,
  },
  plugins: [
    typescript({
      tsconfig: './test_files/source_map_tests/tsconfig.json',
      transformers: {
        before: [compileLitTemplates()],
      },
    }),
  ],
};
