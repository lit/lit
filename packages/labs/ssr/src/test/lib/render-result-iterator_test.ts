/**
 * @license
 * Copyright The Lit Project
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {RenderResultIterator} from '../../lib/render.js';
import type {ThunkedRenderResult, Thunk} from '../../lib/render-result.js';

//
// RenderResultIterator basic functionality
//

test('RenderResultIterator iterates strings', () => {
  const thunked: ThunkedRenderResult = ['a', 'b', 'c'];
  const iterator = new RenderResultIterator(thunked);

  const result1 = iterator.next();
  assert.equal(result1.done, false);
  assert.equal(result1.value, 'a');

  const result2 = iterator.next();
  assert.equal(result2.done, false);
  assert.equal(result2.value, 'b');

  const result3 = iterator.next();
  assert.equal(result3.done, false);
  assert.equal(result3.value, 'c');

  const result4 = iterator.next();
  assert.equal(result4.done, true);
  assert.equal(result4.value, undefined);
});

test('RenderResultIterator handles empty array', () => {
  const thunked: ThunkedRenderResult = [];
  const iterator = new RenderResultIterator(thunked);

  const result = iterator.next();
  assert.equal(result.done, true);
  assert.equal(result.value, undefined);
});

test('RenderResultIterator is iterable', () => {
  const thunked: ThunkedRenderResult = ['a', 'b'];
  const iterator = new RenderResultIterator(thunked);

  // Should be able to use in for...of loop
  const values: (string | Promise<any>)[] = [];
  for (const value of iterator) {
    values.push(value);
  }

  assert.equal(values, ['a', 'b']);
});

//
// Thunk handling
//

test('RenderResultIterator evaluates thunks returning strings', () => {
  const thunk: Thunk = () => 'thunk-value';
  const thunked: ThunkedRenderResult = ['a', thunk, 'b'];
  const iterator = new RenderResultIterator(thunked);

  const result1 = iterator.next();
  assert.equal(result1.done, false);
  assert.equal(result1.value, 'a');

  const result2 = iterator.next();
  assert.equal(result2.done, false);
  assert.equal(result2.value, 'thunk-value');

  const result3 = iterator.next();
  assert.equal(result3.done, false);
  assert.equal(result3.value, 'b');

  const result4 = iterator.next();
  assert.equal(result4.done, true);
});

test('RenderResultIterator evaluates thunks returning arrays with nested thunks', () => {
  const innerThunk: Thunk = () => 'inner-value';
  const outerThunk: Thunk = () => [innerThunk];
  const thunked: ThunkedRenderResult = ['a', outerThunk, 'b'];
  const iterator = new RenderResultIterator(thunked);

  const result1 = iterator.next();
  assert.equal(result1.done, false);
  assert.equal(result1.value, 'a');

  const result2 = iterator.next();
  assert.equal(result2.done, false);
  assert.equal(result2.value, 'inner-value');

  const result3 = iterator.next();
  assert.equal(result3.done, false);
  assert.equal(result3.value, 'b');
});

test('RenderResultIterator evaluates thunks returning arrays', () => {
  const thunk: Thunk = () => ['x', 'y'];
  const thunked: ThunkedRenderResult = ['a', thunk, 'b'];
  const iterator = new RenderResultIterator(thunked);

  const values: string[] = [];
  let result = iterator.next();
  while (!result.done) {
    if (typeof result.value === 'string') {
      values.push(result.value);
    }
    result = iterator.next();
  }

  assert.equal(values, ['a', 'x', 'y', 'b']);
});

test('RenderResultIterator evaluates thunks returning nested arrays', () => {
  const innerThunk: Thunk = () => ['y', 'z'];
  const outerThunk: Thunk = () => ['x', innerThunk];
  const thunked: ThunkedRenderResult = ['a', outerThunk, 'b'];
  const iterator = new RenderResultIterator(thunked);

  const values: string[] = [];
  let result = iterator.next();
  while (!result.done) {
    if (typeof result.value === 'string') {
      values.push(result.value);
    }
    result = iterator.next();
  }

  assert.equal(values, ['a', 'x', 'y', 'z', 'b']);
});

//
// Promise handling
//

test('RenderResultIterator converts Promise<string> to Promise<RenderResult>', async () => {
  const thunk: Thunk = () => Promise.resolve('async-value');
  const thunked: ThunkedRenderResult = ['a', thunk, 'b'];
  const iterator = new RenderResultIterator(thunked);

  const result1 = iterator.next();
  assert.equal(result1.done, false);
  assert.equal(result1.value, 'a');

  const result2 = iterator.next();
  assert.equal(result2.done, false);
  assert.ok(result2.value instanceof Promise);

  const resolvedValue = await result2.value;
  assert.equal(resolvedValue, 'async-value');

  const result3 = iterator.next();
  assert.equal(result3.done, false);
  assert.equal(result3.value, 'b');
});

test('RenderResultIterator converts Promise<array> to Promise<RenderResult>', async () => {
  const thunk: Thunk = () => Promise.resolve(['x', 'y']);
  const thunked: ThunkedRenderResult = ['a', thunk, 'b'];
  const iterator = new RenderResultIterator(thunked);

  const result1 = iterator.next();
  assert.equal(result1.done, false);
  assert.equal(result1.value, 'a');

  const result2 = iterator.next();
  assert.equal(result2.done, false);
  assert.ok(result2.value instanceof Promise);

  const resolvedIterator = await result2.value;
  assert.equal(resolvedIterator, iterator); // Should return the same iterator

  // Continue iterating to get the array values
  const result3 = iterator.next();
  assert.equal(result3.done, false);
  assert.equal(result3.value, 'x');

  const result4 = iterator.next();
  assert.equal(result4.done, false);
  assert.equal(result4.value, 'y');

  const result5 = iterator.next();
  assert.equal(result5.done, false);
  assert.equal(result5.value, 'b');
});

//
// Error handling
//

test('RenderResultIterator throws when calling next() while waiting', () => {
  const thunk: Thunk = () => Promise.resolve('async-value');
  const thunked: ThunkedRenderResult = ['a', thunk];
  const iterator = new RenderResultIterator(thunked);

  // Get first value
  iterator.next();

  // Get promise value (sets _waiting to true)
  const result = iterator.next();
  assert.ok(result.value instanceof Promise);

  // Trying to call next() again should throw
  assert.throws(
    () => iterator.next(),
    'Cannot call next() while waiting for a Promise to resolve'
  );
});

test('RenderResultIterator handles rejected promises', async () => {
  const thunk: Thunk = () => Promise.reject(new Error('async error'));
  const thunked: ThunkedRenderResult = ['a', thunk, 'b'];
  const iterator = new RenderResultIterator(thunked);

  // Get first value
  const result1 = iterator.next();
  assert.equal(result1.value, 'a');

  // Get promise value
  const result2 = iterator.next();
  assert.ok(result2.value instanceof Promise);

  // Promise should reject
  try {
    await result2.value;
    assert.unreachable('Promise should have rejected');
  } catch (error: any) {
    assert.equal(error.message, 'async error');
  }
});

//
// Complex scenarios
//

test('RenderResultIterator handles mixed sync/async complex nesting', async () => {
  const asyncThunk: Thunk = () => Promise.resolve(['async-x', 'async-y']);
  const nestedThunk: Thunk = () => ['nested', asyncThunk];
  const thunked: ThunkedRenderResult = ['start', nestedThunk, 'end'];
  const iterator = new RenderResultIterator(thunked);

  // start
  const result1 = iterator.next();
  assert.equal(result1.value, 'start');

  // nested
  const result2 = iterator.next();
  assert.equal(result2.value, 'nested');

  // async promise
  const result3 = iterator.next();
  assert.ok(result3.value instanceof Promise);
  const resolvedIterator = await result3.value;
  assert.equal(resolvedIterator, iterator);

  // async-x
  const result4 = iterator.next();
  assert.equal(result4.value, 'async-x');

  // async-y
  const result5 = iterator.next();
  assert.equal(result5.value, 'async-y');

  // end
  const result6 = iterator.next();
  assert.equal(result6.value, 'end');

  // done
  const result7 = iterator.next();
  assert.equal(result7.done, true);
});

test('RenderResultIterator handles nested arrays with async thunks', async () => {
  const innerThunk: Thunk = () => Promise.resolve(['inner-async']);
  const middleArray: ThunkedRenderResult = [innerThunk];
  const outerThunk: Thunk = () => middleArray;
  const thunked: ThunkedRenderResult = ['before', outerThunk, 'after'];
  const iterator = new RenderResultIterator(thunked);

  // before
  const result1 = iterator.next();
  assert.equal(result1.value, 'before');

  // Promise from nested thunk
  const result2 = iterator.next();
  assert.ok(result2.value instanceof Promise);
  const resolvedIterator = await result2.value;
  assert.equal(resolvedIterator, iterator);

  // inner-async
  const result3 = iterator.next();
  assert.equal(result3.value, 'inner-async');

  // after
  const result4 = iterator.next();
  assert.equal(result4.value, 'after');

  // done
  const result5 = iterator.next();
  assert.equal(result5.done, true);
});

//
// Additional edge cases
//

test('RenderResultIterator handles empty thunk results', () => {
  const emptyThunk: Thunk = () => [];
  const thunked: ThunkedRenderResult = ['a', emptyThunk, 'b'];
  const iterator = new RenderResultIterator(thunked);

  const values: string[] = [];
  let result = iterator.next();
  while (!result.done) {
    if (typeof result.value === 'string') {
      values.push(result.value);
    }
    result = iterator.next();
  }

  assert.equal(values, ['a', 'b']);
});

test('RenderResultIterator handles thunk that returns Promise of empty array', async () => {
  const asyncEmptyThunk: Thunk = () => Promise.resolve([]);
  const thunked: ThunkedRenderResult = ['before', asyncEmptyThunk, 'after'];
  const iterator = new RenderResultIterator(thunked);

  // Get 'before'
  const result1 = iterator.next();
  assert.equal(result1.value, 'before');

  // Get promise that resolves to empty array
  const result2 = iterator.next();
  assert.ok(result2.value instanceof Promise);

  const resolved = await result2.value;
  assert.equal(resolved, iterator); // Promise resolves to the iterator itself

  // Should be able to continue to 'after'
  const result3 = iterator.next();
  assert.equal(result3.value, 'after');

  // Done
  const result4 = iterator.next();
  assert.equal(result4.done, true);
});

test('RenderResultIterator Symbol.iterator returns itself', () => {
  const thunked: ThunkedRenderResult = ['a', 'b'];
  const iterator = new RenderResultIterator(thunked);

  assert.equal(iterator[Symbol.iterator](), iterator);
});

test.run();
