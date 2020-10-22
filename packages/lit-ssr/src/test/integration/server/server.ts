/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
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

import {createRequire} from 'module';
import Koa from 'koa';
import Router from '@koa/router';

import {importModule} from '../../../lib/import-module.js';
import {getWindow} from '../../../lib/dom-shim.js';
import {Readable} from 'stream';

import * as testModule from '../tests/basic-ssr.js';
import {SSRTest} from '../tests/ssr-test';

export const startServer = async (port = 9090) => {
  const app = new Koa();

  const router = new Router();
  router.get('/test/:suite/:test', async (context) => {
    const suiteName = context.params.suite;
    const testName = context.params.test;

    const window = getWindow({
      // We need to give window a require to load CJS modules used by the SSR
      // implementation. If we had only JS module dependencies, we wouldn't need this.
      require: createRequire(import.meta.url),
    });
    const {namespace} = await importModule(
      `../tests/${suiteName}-ssr.js`,
      import.meta.url,
      window
    );
    const module = namespace as typeof testModule;

    const testDescOrFn = module.tests[testName] as SSRTest;
    const test =
      typeof testDescOrFn === 'function' ? testDescOrFn() : testDescOrFn;
    const {render} = module;
    if (test.registerElements) {
      await test.registerElements();
    }
    const result = render(test.render(...test.expectations[0].args));
    context.type = 'text/html';
    context.body = Readable.from(result);
  });

  app.use(router.routes());
  app.use(router.allowedMethods());
  return app.listen(port, () => {
    console.log(`SSR test server listening on port ${port}`);
  });
};
