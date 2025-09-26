/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {collectResult, collectResultSync} from '../../lib/render-result.js';

//
// collectResultSync
//

// Both RenderResult and ThunkedRenderResult

test('collectResultSync collects strings', () => {
  assert.equal(collectResultSync(['a', 'b', 'c']), 'abc');
});

// ThunkedRenderResult only

test('collectResultSync throws for a thunk returning a Promise', () => {
  assert.throws(
    () => collectResultSync(['a', () => Promise.resolve(['b']), 'c']),
    'Promises not supported in collectResultSync'
  );
});

// RenderResult only

test('collectResultSync throws for a Promise', () => {
  assert.throws(
    () => collectResultSync(['a', Promise.resolve(['b']), 'c']),
    'abc'
  );
});

//
// collectResult
//

// Both RenderResult and ThunkedRenderResult

test('collectResult collects strings', async () => {
  assert.equal(await collectResult(['a', 'b', 'c']), 'abc');
});

// ThunkedRenderResult only

test('collectResult collects strings and thunks', async () => {
  assert.equal(await collectResult(['a', () => ['b'], 'c']), 'abc');
});

test('collectResult collects strings and thunks returning arrays', async () => {
  assert.equal(await collectResult(['a', () => ['b', 'c'], 'd']), 'abcd');
});

test('collectResult collects strings and thunks returning Promises', async () => {
  assert.equal(
    await collectResult([
      'a',
      () => Promise.resolve(['b', 'c']),
      'd',
      () => Promise.resolve('e'),
    ]),
    'abcde'
  );
});

test('collectResult collects nested thunks', async () => {
  assert.equal(await collectResult(['a', () => [() => 'b', 'c'], 'd']), 'abcd');
});

// RenderResult only

test('collectResult collects strings and Promises', async () => {
  assert.equal(await collectResult(['a', Promise.resolve(['b']), 'c']), 'abc');
});

test('collectResult collects non-array iterables', async () => {
  assert.equal(
    await collectResult(
      ['a', Promise.resolve(['b'][Symbol.iterator]()), 'c'][Symbol.iterator]()
    ),
    'abc'
  );
});

test('collectResultSync throws for a Promise', () => {
  assert.throws(
    () => collectResultSync(['a', Promise.resolve(['b']), 'c']),
    'abc'
  );
});

test('collectResult collects strings and Promises of iterables', async () => {
  assert.equal(
    await collectResult(['a', Promise.resolve(['b', 'c']), 'd']),
    'abcd'
  );
});

test('collectResult collects strings and nested Promises of iterables', async () => {
  assert.equal(
    await collectResult([
      'a',
      Promise.resolve([Promise.resolve(['b', 'c'])]),
      'd',
    ]),
    'abcd'
  );
});

test.run();
