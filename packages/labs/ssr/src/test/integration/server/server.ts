/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createRequire} from 'module';
import Koa from 'koa';
import Router from '@koa/router';
import cors from 'koa-cors';

import {importModule} from '../../../lib/import-module.js';
import {getWindow} from '../../../lib/dom-shim.js';
import {Readable} from 'stream';

import * as testModule from '../tests/basic-ssr.js';
import {SSRTest} from '../tests/ssr-test';

export const startServer = async (port = 9090) => {
  const app = new Koa();

  const router = new Router();
  router.get('/:mode/:testFile/:testName', async (context) => {
    const {mode, testFile, testName} = context.params;

    let module: typeof testModule,
      render: typeof import('../../../lib/render-lit-html.js').render;
    if (mode === 'global') {
      render = (await import('../../../lib/render-global.js')).render;
      module = await import(`../tests/${testFile}-ssr.js`);
    } else {
      const window = getWindow({
        // We need to give window a require to load CJS modules used by the SSR
        // implementation. If we had only JS module dependencies, we wouldn't need this.
        require: createRequire(import.meta.url),
      });
      module = (
        await importModule(
          `../tests/${testFile}-ssr.js`,
          import.meta.url,
          window
        )
      ).namespace;
      render = module.render;
    }

    const testDescOrFn = module.tests[testName] as SSRTest;
    const test =
      typeof testDescOrFn === 'function' ? testDescOrFn() : testDescOrFn;
    if (test.registerElements) {
      await test.registerElements();
    }
    const result = render(test.render(...test.expectations[0].args));
    context.type = 'text/html';
    context.body = Readable.from(result);
  });

  app.use(cors());
  app.use(router.routes());
  app.use(router.allowedMethods());
  return app.listen(port, () => {
    console.log(`SSR test server listening on port ${port}`);
  });
};
