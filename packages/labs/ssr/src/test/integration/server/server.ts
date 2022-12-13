/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import Router from '@koa/router';
import cors from 'koa-cors';

import {ModuleLoader} from '../../../lib/module-loader.js';
import {getWindow} from '../../../lib/dom-shim.js';
import {Readable} from 'stream';

import * as testModule from '../tests/basic-ssr.js';
import {SSRTest} from '../tests/ssr-test.js';

/**
 * Koa Middleware for @web/test-runner which handles /render/ prefixed GET
 * requests and renders the a given file + test with a given SSR render method.
 */
export const ssrMiddleware = () => {
  const router = new Router();
  router.get('/render/:mode/:testFile/:testName', async (context) => {
    const {mode, testFile, testName} = context.params;

    let module: typeof testModule,
      render: typeof import('../../../lib/render-lit-html.js').render;
    if (mode === 'global') {
      render = (await import('../../../lib/render-with-global-dom-shim.js'))
        .render;
      module = await import(`../tests/${testFile}-ssr.js`);
    } else {
      // mode === 'vm'
      const window = getWindow({includeJSBuiltIns: true});
      const loader = new ModuleLoader({
        global: window,
      });
      module = (
        await loader.importModule(
          `../tests/${testFile}-ssr.js`,
          import.meta.url
        )
      ).module.namespace as typeof testModule;
      render = module.render;
    }

    const testDescOrFn = module.tests[testName] as SSRTest;
    const test =
      typeof testDescOrFn === 'function' ? testDescOrFn() : testDescOrFn;
    if (test.registerElements) {
      await test.registerElements();
    }
    const result = render(
      test.render(...test.expectations[0].args),
      test.serverRenderOptions
    );
    context.type = 'text/html';
    context.body = Readable.from(result);
  });
  return [cors(), router.routes(), router.allowedMethods()];
};
