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

test.run();

const collectReadable = async (r: Readable) => {
  let s = '';
  for await (const v of r) {
    s += v;
  }
  return s;
};
