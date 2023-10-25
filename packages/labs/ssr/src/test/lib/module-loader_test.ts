/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ModuleLoader} from '../../lib/module-loader.js';
import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as path from 'path';

const testIndex = new URL(
  '../test-files/module-loader/index.js',
  import.meta.url
).pathname;

test('loads a single module', async () => {
  const loader = new ModuleLoader();
  const result = await loader.importModule('./test-1.js', testIndex);
  const {module, path: modulePath} = result;
  assert.is(module.namespace.x, 1);
  const moduleRecord = loader.cache.get(modulePath);
  assert.ok(moduleRecord);
  assert.is(moduleRecord?.imports.length, 0);
});

test('loads a module with an import', async () => {
  const loader = new ModuleLoader();
  const result = await loader.importModule('./index.js', testIndex);
  const {module, path: modulePath} = result;
  assert.is(module.namespace.y, 1);

  // Check that test-1.js is a dep of index.js
  const moduleRecord = loader.cache.get(modulePath);
  assert.ok(moduleRecord);
  const depModulePath = path.resolve(path.dirname(testIndex), './test-1.js');
  assert.is(moduleRecord!.imports.includes(depModulePath), true);
});

test('loads a module with a built-in import', async () => {
  const loader = new ModuleLoader();
  const result = await loader.importModule('./test-2.js', testIndex);
  const {module} = result;
  assert.is(loader.cache.has('path'), true);
  assert.ok(module.namespace.join);
});

test('resolves an exact exported path', async () => {
  const loader = new ModuleLoader();
  const result = await loader.importModule('./lit-import.js', testIndex);
  const {module, path: modulePath} = result;
  assert.is(module.namespace.litIsServer, true);
  assert.ok(loader.cache.has(modulePath));
  const isServerPath = path.resolve(
    path.dirname(testIndex),
    '../../../../../lit-html/node/is-server.js'
  );
  assert.ok(loader.cache.has(isServerPath));
});

test('resolves a root exported path (.)', async () => {
  const loader = new ModuleLoader();
  const result = await loader.importModule(
    './lit-import-from-root.js',
    testIndex
  );
  const {module, path: modulePath} = result;
  assert.is(module.namespace.litIsServer, true);
  assert.ok(loader.cache.has(modulePath));
  const litPath = path.resolve(
    path.dirname(testIndex),
    '../../../../../lit/index.js'
  );
  const isServerPath = path.resolve(
    path.dirname(testIndex),
    '../../../../../lit-html/node/is-server.js'
  );
  assert.ok(loader.cache.has(litPath));
  assert.ok(loader.cache.has(isServerPath));
});

test('prefers "module" condition over "import"', async () => {
  const loader = new ModuleLoader();
  const result = await loader.importModule(
    './module-package-import.js',
    testIndex
  );
  const {module, path: modulePath} = result;
  assert.is(module.namespace.packageValue, 'module');
  assert.ok(loader.cache.has(modulePath));
  const packagePath = path.resolve(
    path.dirname(testIndex),
    '../../../../test-projects/test-module-package/index.module.js'
  );
  assert.ok(loader.cache.has(packagePath));
});

test('concurrently load modules with a shared dependency without crashing', async () => {
  const loader = new ModuleLoader();
  // Both of these dependencies import LitElement from `lit`.
  const [rootResult, result] = await Promise.all([
    loader.importModule('./lit-import-from-root.js', testIndex),
    loader.importModule('./lit-import.js', testIndex),
  ]);
  const {module: rootModule} = rootResult;
  const {module} = result;

  assert.ok(rootModule.namespace.litElement);
  assert.is(rootModule.namespace.litElement, module.namespace.litElement);
});

test.run();
