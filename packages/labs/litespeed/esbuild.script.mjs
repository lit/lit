/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./main.ts'],
  bundle: true,
  outfile: 'built/bundle.js',
  platform: 'node',
  // minify: true,
  target: 'es2018',
  format: 'cjs',
  color: true,
  external: ['vscode', '@web/dev-server', '@web/dev-server-core'],
  mainFields: ['module', 'main'],
});
