/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Readable} from 'node:stream';
import {Worker} from 'node:worker_threads';
import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {html} from 'lit';
import {
  createRenderWorker,
  render,
  RenderResultReadable,
} from '../../worker.js';
import {simpleTemplateWithElement} from '../test-files/render-test-module.js';

test('render via worker', async () => {
  const worker = createRenderWorker();
  try {
    const result = render(html`<div>${'test'}</div>`, {worker});
    const value = await collectReadable(new RenderResultReadable(result));
    assert.equal(
      value,
      '<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->test<!--/lit-part--></div><!--/lit-part-->'
    );
  } finally {
    worker.terminate();
  }
});

test('render multiple requests via worker', async () => {
  const worker = createRenderWorker();
  try {
    const result = await collectReadable(
      new RenderResultReadable(render(html`<div>${'test'}</div>`, {worker}))
    );
    assert.equal(
      result,
      '<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->test<!--/lit-part--></div><!--/lit-part-->'
    );

    const result2 = await collectReadable(
      new RenderResultReadable(render(html`<div>${'test2'}</div>`, {worker}))
    );
    assert.equal(
      result2,
      '<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->test2<!--/lit-part--></div><!--/lit-part-->'
    );
  } finally {
    worker.terminate();
  }
});

test('render multiple requests in parallel via prepared worker', async () => {
  const worker = createRenderWorker();
  try {
    const results = await Promise.all(
      [0, 1, 2, 3].map(async (i) => {
        return collectReadable(
          new RenderResultReadable(
            render(html`<div>${`test${i}`}</div>`, {worker})
          )
        );
      })
    );

    results.forEach((result, i) => {
      assert.equal(
        result,
        `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->test${i}<!--/lit-part--></div><!--/lit-part-->`
      );
    });
  } finally {
    worker.terminate();
  }
});

test('render with custom worker', async () => {
  const worker = new Worker(
    new URL('../test-files/worker/prepared-worker.js', import.meta.url)
  );
  try {
    const result = render({value: 'custom worker'}, {worker});
    const value = await collectReadable(new RenderResultReadable(result));
    assert.equal(
      value,
      '<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->custom worker<!--/lit-part--></div><!--/lit-part-->'
    );
  } finally {
    worker.terminate();
  }
});

test('render web components via worker', async () => {
  const worker = createRenderWorker({
    modules: [
      new URL('../test-files/render-test-module.js', import.meta.url).href,
    ],
  });
  try {
    const result = render(simpleTemplateWithElement, {worker});
    const value = await collectReadable(new RenderResultReadable(result));
    assert.equal(
      value,
      '<!--lit-part tjmYe1kHIVM=--><test-simple><template shadowroot="open" shadowrootmode="open"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template></test-simple><!--/lit-part-->'
    );
  } finally {
    worker.terminate();
  }
});

test.run();

const collectReadable = async (r: Readable) => {
  let s = '';
  for await (const v of r) {
    s += v;
  }
  return s;
};
