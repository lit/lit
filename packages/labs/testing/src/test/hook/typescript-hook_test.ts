/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {readFileSync} from 'node:fs';
import type {LoadHookContext, ResolveHookContext} from 'node:module';
import {fileURLToPath} from 'node:url';

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';

import * as hook from '../../lib/typescript-hook.js';

const testFilesDir = new URL('../../test_files/', import.meta.url).href;
const hookContext: Omit<
  ResolveHookContext | LoadHookContext,
  'parentURL' | 'format'
> = {
  conditions: [],
  importAssertions: null!,
  importAttributes: null!,
};
const resolveHookContext: ResolveHookContext = {
  ...hookContext,
  parentURL: testFilesDir,
};
const loadHookContext: LoadHookContext = {
  ...hookContext,
  format: 'module',
};
const throwOnCall = () => {
  throw new Error('Unexpected call');
};

test('should resolve ts file', async () => {
  const result = await hook.resolve(
    './test-resolve.js',
    resolveHookContext,
    throwOnCall
  );
  assert.equal(result.format, 'module');
  assert.ok(result.shortCircuit);
  assert.match(
    result.url,
    /lit\/packages\/labs\/testing\/test_files\/test-resolve.ts$/
  );
});

test('should resolve mts file', async () => {
  const result = await hook.resolve(
    './test-resolve.mjs',
    resolveHookContext,
    throwOnCall
  );
  assert.equal(result.format, 'module');
  assert.ok(result.shortCircuit);
  assert.match(
    result.url,
    /lit\/packages\/labs\/testing\/test_files\/test-resolve.mts$/
  );
});

test('should not resolve ts file, if js file exists', async () => {
  let counter = 0;
  const nextResolveResult = 'placeholder';
  const testSpecifier = './test-resolve-js-exists.js';
  const result = await hook.resolve(
    testSpecifier,
    resolveHookContext,
    (specifier, context) => {
      counter++;
      assert.equal(specifier, testSpecifier);
      assert.is(context, resolveHookContext);
      return {format: 'module', shortCircuit: true, url: nextResolveResult};
    }
  );
  assert.equal(counter, 1);
  assert.equal(result.url, nextResolveResult);
});

test('should transpile ts file', async () => {
  const result = await hook.load(
    new URL('./element.ts', testFilesDir).href,
    loadHookContext,
    throwOnCall
  );
  assert.equal(result.format, 'module');
  assert.ok(result.shortCircuit);
  assert.equal(
    result.source,
    readFileSync(new URL('./elements-compiled.js', testFilesDir), 'utf8')
  );
});

test('should transpile ts file with custom tsconfig path', async () => {
  try {
    hook.initialize({
      tsconfig: fileURLToPath(
        new URL('./tsconfig.standard-decorator.json', testFilesDir)
      ),
    });
    const result = await hook.load(
      new URL('./element.ts', testFilesDir).href,
      loadHookContext,
      throwOnCall
    );
    assert.equal(result.format, 'module');
    assert.ok(result.shortCircuit);
    assert.equal(
      result.source,
      readFileSync(
        new URL('./elements-compiled-standard-decorators.js', testFilesDir),
        'utf8'
      )
    );
  } finally {
    hook.initialize(undefined);
  }
});

test.run();
