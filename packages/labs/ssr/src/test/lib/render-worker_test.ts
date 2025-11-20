/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Readable} from 'node:stream';
import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {renderInWorker} from '../../index.js';
import type {Data} from '../test-files/render-worker.js';

const workerModule = new URL('../test-files/render-worker.js', import.meta.url)
  .href;

test('render in worker', async () => {
  console.time('renderInWorker');
  const readable = await renderInWorker({
    value: <Data>{value: 'my test'},
    workerModule,
  });
  console.timeEnd('renderInWorker');

  console.time('collectReadable');
  const value = await collectReadable(readable);
  console.timeEnd('collectReadable');
  assert.equal(
    value,
    '<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->my test<!--/lit-part--></div><!--/lit-part-->'
  );
});

test('render web components via worker', async () => {
  console.time('renderInWorker');
  const readable = await renderInWorker({
    value: <Data>{value: 'simpleTemplateWithElement'},
    workerModule,
  });
  console.timeEnd('renderInWorker');

  const value = await collectReadable(readable);
  assert.equal(
    value,
    '<!--lit-part tjmYe1kHIVM=--><test-simple><template shadowroot="open" shadowrootmode="open"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template></test-simple><!--/lit-part-->'
  );
});

test.run();

const collectReadable = async (r: Readable) => {
  let s = '';
  for await (const v of r) {
    s += v;
  }
  return s;
};
