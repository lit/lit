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

import {renderModule} from '../../lib/render-module.js';
import {Readable} from 'stream';
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

  const ssrResult = await (renderModule(
    './app-server.js',
    import.meta.url,
    'renderAppWithInitialData',
    []
  ) as Promise<Iterable<unknown>>);

  ctx.type = 'text/html';
  ctx.body = Readable.from(ssrResult);
});
app.use(nodeResolve({root: monorepoRoot}));
app.use(
  mount('/node_modules', staticFiles(path.join(monorepoRoot, 'node_modules')))
);
app.use(staticFiles(ssrPackageRoot));
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
