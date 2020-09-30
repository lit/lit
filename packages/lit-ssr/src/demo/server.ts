/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import Koa from 'koa';
import staticFiles from 'koa-static';
import koaNodeResolve from 'koa-node-resolve';
import {URL} from 'url';
import * as path from 'path';

import {renderModule} from '../lib/render-module.js';
import {IterableReader} from '../lib/util/iterator-readable.js';

const {nodeResolve} = koaNodeResolve;

const moduleUrl = new URL(import.meta.url);
const packageRoot = path.resolve(moduleUrl.pathname, '../..');

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
  ctx.body = new IterableReader(ssrResult);
});
app.use(nodeResolve({}));
app.use(staticFiles(packageRoot));
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
