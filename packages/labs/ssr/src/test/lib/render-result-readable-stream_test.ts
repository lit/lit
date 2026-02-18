/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import type {ReadableStream as NodeReadableStream} from 'node:stream/web';
import {createReadableStream} from '../../lib/render-result-readable-stream.js';

test('ReadableStream collects strings', async () => {
  const s = await collectReadable(createReadableStream(['a', 'b', 'c']));
  assert.equal(s, 'abc');
});

test('ReadableStream collects strings and Promises', async () => {
  const s = await collectReadable(
    createReadableStream(['a', Promise.resolve(['b']), 'c'])
  );
  assert.equal(s, 'abc');
});

test('ReadableStream collects strings and Promises of iterables', async () => {
  const s = await collectReadable(
    createReadableStream(['a', Promise.resolve(['b', 'c']), 'd'])
  );
  assert.equal(s, 'abcd');
});

test('ReadableStream collects strings and nested Promises of iterables', async () => {
  const s = await collectReadable(
    createReadableStream([
      'a',
      Promise.resolve([Promise.resolve(['b', 'c'])]),
      'd',
    ])
  );
  assert.equal(s, 'abcd');
});

test('ReadableStream yields for some time until promises resolve', async () => {
  const readable = createReadableStream([
    'a',
    new Promise((res) => setTimeout(res, 50)).then((_) => ['b', 'c']),
    new Promise((res) => setTimeout(res, 50)).then((_) => ['d', 'e']),
    'f',
  ]);
  const s = await collectReadable(readable);
  assert.equal(s, 'abcdef');
});

test.run();

const collectReadable = async (r: NodeReadableStream) => {
  let s = '';
  const decoder = new TextDecoder();
  for await (const v of r) {
    s += decoder.decode(v, {stream: true});
  }
  return s;
};
