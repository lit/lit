/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as esbuild from 'esbuild';

const DEV_MODE = true;

const config = {
  bundle: true,
  minify: !DEV_MODE,
  sourcemap: DEV_MODE,
  platform: 'node',
  mainFields: ['module', 'main'],
  format: 'esm',
  external: ['vscode', '@vscode/codicons'],
};

await Promise.all([
  esbuild.build({
    ...config,
    entryPoints: ['./src/frame-entrypoint.ts'],
    outfile: './bundled/frame-entrypoint.js',
  }),
  esbuild.build({
    ...config,
    entryPoints: ['./src/editor-entrypoint.ts'],
    outfile: './bundled/editor-entrypoint.js',
  }),
]);
