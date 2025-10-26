/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Readable} from 'node:stream';
import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {Worker} from 'node:worker_threads';
import {RenderResultReadable} from '../../lib/worker/render-result-readable.js';

test('render via internal worker', async () => {
  const readable = new RenderResultReadable({
    workerUrl: new URL(
      '../test-files/worker/internal-worker.js',
      import.meta.url
    ),
    data: {value: 'test'},
  });
  const result = await collectReadable(readable);
  assert.equal(
    result,
    '<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->test<!--/lit-part--></div><!--/lit-part-->'
  );
});

test('render via prepared worker', async () => {
  const worker = new Worker(
    new URL('../test-files/worker/prepared-worker.js', import.meta.url)
  );

  const readable = new RenderResultReadable({data: {value: 'test'}, worker});
  const result = await collectReadable(readable);
  assert.equal(
    result,
    '<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->test<!--/lit-part--></div><!--/lit-part-->'
  );

  worker.terminate();
});

test('render multiple requests via prepared worker', async () => {
  const worker = new Worker(
    new URL('../test-files/worker/prepared-worker.js', import.meta.url)
  );

  const result = await collectReadable(
    new RenderResultReadable({data: {value: 'test'}, worker})
  );
  assert.equal(
    result,
    '<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->test<!--/lit-part--></div><!--/lit-part-->'
  );

  const result2 = await collectReadable(
    new RenderResultReadable({data: {value: 'test2'}, worker})
  );
  assert.equal(
    result2,
    '<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->test2<!--/lit-part--></div><!--/lit-part-->'
  );

  worker.terminate();
});

test('render multiple requests in parallel via prepared worker', async () => {
  const worker = new Worker(
    new URL('../test-files/worker/prepared-worker.js', import.meta.url)
  );

  const results = await Promise.all(
    [1, 2, 3].map(async (i) => {
      return collectReadable(
        new RenderResultReadable({data: {value: `test${i}`}, worker})
      );
    })
  );

  results.forEach((result, i) => {
    assert.equal(
      result,
      `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->test${i + 1}<!--/lit-part--></div><!--/lit-part-->`
    );
  });

  worker.terminate();
});

test.run();

const collectReadable = async (r: Readable) => {
  let s = '';
  for await (const v of r) {
    s += v;
  }
  return s;
};
