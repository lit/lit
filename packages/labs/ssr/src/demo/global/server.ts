/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import Koa from 'koa';
import staticFiles from 'koa-static';
import koaNodeResolve from 'koa-node-resolve';
import {URL} from 'url';
import * as path from 'path';
import {renderAppWithInitialData} from './app-server.js';
import {RenderResultReadable} from '../../lib/render-result-readable.js';
import mount from 'koa-mount';
const {nodeResolve} = koaNodeResolve;

const moduleUrl = new URL(import.meta.url);
const ssrPackageRoot = path.resolve(moduleUrl.pathname, '../../..');
const monorepoRoot = path.resolve(moduleUrl.pathname, '../../../../../..');

const port = 8080;

// This is a fairly standard Koa server that represents how the SSR API might
// be used.
const app = new Koa();
app.use(async (ctx: Koa.Context, next: Function) => {
  // Pass through anything not the root path to static file serving
  if (ctx.URL.pathname !== '/') {
    await next();
    return;
  }

  const ssrResult = renderAppWithInitialData();
  ctx.type = 'text/html';
  ctx.body = new RenderResultReadable(ssrResult);
});
app.use(nodeResolve({root: monorepoRoot}));
app.use(
  mount('/node_modules', staticFiles(path.join(monorepoRoot, 'node_modules')))
);
app.use(staticFiles(ssrPackageRoot));
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
