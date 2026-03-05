/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';

suite('module resolution', () => {
  test('ResizeController can be imported from its individual entry point', async () => {
    const module = await import('@lit-labs/observers/resize-controller.js');
    assert.isFunction(module.ResizeController);
  });

  test('IntersectionController can be imported from its individual entry point', async () => {
    const module = await import(
      '@lit-labs/observers/intersection-controller.js'
    );
    assert.isFunction(module.IntersectionController);
  });

  test('MutationController can be imported from its individual entry point', async () => {
    const module = await import('@lit-labs/observers/mutation-controller.js');
    assert.isFunction(module.MutationController);
  });

  test('PerformanceController can be imported from its individual entry point', async () => {
    const module = await import(
      '@lit-labs/observers/performance-controller.js'
    );
    assert.isFunction(module.PerformanceController);
  });

  test('all controllers can be imported from the main entry point', async () => {
    const module = await import('@lit-labs/observers');
    assert.isFunction(module.ResizeController);
    assert.isFunction(module.IntersectionController);
    assert.isFunction(module.MutationController);
    assert.isFunction(module.PerformanceController);
  });

  test('lit-html dependencies are resolvable from resize-controller', async () => {
    // These are the specific lit-html imports that fail under pnpm
    // hoist=false when lit-html is not declared as a dependency.
    const asyncDirective = await import('lit-html/async-directive.js');
    assert.isFunction(asyncDirective.AsyncDirective);

    const directive = await import('lit-html/directive.js');
    assert.isFunction(directive.directive);

    const isServerModule = await import('lit-html/is-server.js');
    assert.isDefined(isServerModule.isServer);
  });

  test('multiple imports of the same controller do not throw', async () => {
    // Simulate multiple bundle loads importing the same module
    const [mod1, mod2] = await Promise.all([
      import('@lit-labs/observers/resize-controller.js'),
      import('@lit-labs/observers/resize-controller.js'),
    ]);
    assert.strictEqual(mod1.ResizeController, mod2.ResizeController);
  });
});
