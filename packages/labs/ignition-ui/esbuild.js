/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/* eslint-disable no-undef */
import {build} from 'esbuild';

const DEV_MODE = true;

const config = {
  bundle: true,
  minify: !DEV_MODE,
  sourcemap: DEV_MODE,
  platform: 'node',
  mainFields: ['module', 'main'],
  format: 'esm',
  external: ['vscode'],
};

await Promise.all([
  build({
    ...config,
    entryPoints: ['./src/frame-entrypoint.ts'],
    outfile: './bundled/frame-entrypoint.js',
  }),
  build({
    ...config,
    entryPoints: ['./src/webview-entrypoint.ts'],
    outfile: './bundled/webview-entrypoint.js',
  }),
]);
