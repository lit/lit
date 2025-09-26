/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Readable} from 'stream';
import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {RenderResultReadable} from '../../lib/render-result-readable.js';

// RenderResult

test('RenderResultReadable collects strings', async () => {
  const s = await collectReadable(new RenderResultReadable(['a', 'b', 'c']));
  assert.equal(s, 'abc');
});

test('RenderResultReadable collects strings and Promises', async () => {
  const s = await collectReadable(
    new RenderResultReadable(['a', Promise.resolve(['b']), 'c'])
  );
  assert.equal(s, 'abc');
});

test('RenderResultReadable collects strings and Promises of iterables', async () => {
  const s = await collectReadable(
    new RenderResultReadable(['a', Promise.resolve(['b', 'c']), 'd'])
  );
  assert.equal(s, 'abcd');
});

test('RenderResultReadable collects strings and nested Promises of iterables', async () => {
  const s = await collectReadable(
    new RenderResultReadable([
      'a',
      Promise.resolve([Promise.resolve(['b', 'c'])]),
      'd',
    ])
  );
  assert.equal(s, 'abcd');
});

test('RenderResultReadable collects all iterables when stream is back pressured', async () => {
  class TestRenderResultReadable extends RenderResultReadable {
    override push(value: any) {
      super.push(value);

      // for the value different from "__" we return true to indicate that we can accept more data
      return value !== '__';
    }
  }

  const readable = new TestRenderResultReadable([
    'a',
    Promise.resolve([Promise.resolve(['__', 'b'])]),
    '__',
    'c',
  ]);

  const s = await collectReadable(readable);
  assert.equal(s, 'a__b__c');
});

test('RenderResultReadable yields for some time until promises resolve', async () => {
  const readable = new RenderResultReadable([
    'a',
    new Promise((res) => setTimeout(res, 50)).then((_) => ['b', 'c']),
    new Promise((res) => setTimeout(res, 50)).then((_) => ['d', 'e']),
    'f',
  ]);
  const s = await collectReadable(readable);
  assert.equal(s, 'abcdef');
});

test('pulling synchronously from RenderResultReadable cannot skip async work', async () => {
  const readable = new RenderResultReadable([
    'a',
    new Promise((res) => setTimeout(res, 50)).then((_) => ['b']),
    'c',
  ]);
  readable.setEncoding('utf8');
  assert.equal(readable.read(), 'a');
  // Regression test where it was possible to skip Promises by calling `.read`
  // while a promise was still resolving.
  assert.equal(readable.read(), null);
});

// ThunkedRenderResult

test('RenderResultReadable collects strings', async () => {
  const s = await collectReadable(new RenderResultReadable(['a', 'b', 'c']));
  assert.equal(s, 'abc');
});

test('RenderResultReadable collects strings and thunks', async () => {
  const s = await collectReadable(
    new RenderResultReadable(['a', () => ['b'], 'c', () => 'd'])
  );
  assert.equal(s, 'abcd');
});

test('RenderResultReadable collects strings and thunks returning arrays', async () => {
  const s = await collectReadable(
    new RenderResultReadable(['a', () => ['b', 'c'], 'd'])
  );
  assert.equal(s, 'abcd');
});

test('RenderResultReadable collects strings and nested thunks', async () => {
  const s = await collectReadable(
    new RenderResultReadable(['a', () => [() => ['b', 'c']], 'd'])
  );
  assert.equal(s, 'abcd');
});

test('RenderResultReadable handles thunks returning promises', async () => {
  const s = await collectReadable(
    new RenderResultReadable([
      'a',
      () => Promise.resolve(['b']),
      'c',
      () => Promise.resolve('d'),
    ])
  );
  assert.equal(s, 'abcd');
});

test('RenderResultReadable collects all iterables when stream is back pressured', async () => {
  class TestRenderResultReadable extends RenderResultReadable {
    override push(value: any) {
      super.push(value);

      // for the value different from "__" we return true to indicate that we can accept more data
      return value !== '__';
    }
  }

  const readable = new TestRenderResultReadable([
    'a',
    () => [() => ['__', 'b']],
    '__',
    'c',
  ]);

  const s = await collectReadable(readable);
  assert.equal(s, 'a__b__c');
});

test('RenderResultReadable yields for some time until thunk promises resolve', async () => {
  const readable = new RenderResultReadable([
    'a',
    () => new Promise((res) => setTimeout(res, 50)).then((_) => ['b', 'c']),
    () => new Promise((res) => setTimeout(res, 50)).then((_) => ['d', 'e']),
    'f',
  ]);
  const s = await collectReadable(readable);
  assert.equal(s, 'abcdef');
});

test('pulling synchronously from RenderResultReadable cannot skip async work', async () => {
  const readable = new RenderResultReadable([
    'a',
    () => new Promise((res) => setTimeout(res, 50)).then((_) => ['b']),
    'c',
  ]);
  readable.setEncoding('utf8');
  assert.equal(readable.read(), 'a');
  // Regression test where it was possible to skip Promises by calling `.read`
  // while a thunk promise was still resolving.
  assert.equal(readable.read(), null);
});

test.run();

const collectReadable = async (r: Readable) => {
  let s = '';
  for await (const v of r) {
    s += v;
  }
  return s;
};
