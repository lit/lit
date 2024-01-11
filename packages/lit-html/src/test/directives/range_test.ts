/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {range} from 'lit-html/directives/range.js';
import {assert} from '@esm-bundle/chai';

suite('range', () => {
  test('positive end', () => {
    assert.deepEqual([...range(0)], []);
    assert.deepEqual([...range(3)], [0, 1, 2]);
  });

  test('start and end', () => {
    assert.deepEqual([...range(0, 3)], [0, 1, 2]);
    assert.deepEqual([...range(-1, 1)], [-1, 0]);
    assert.deepEqual([...range(-2, -1)], [-2]);
  });

  test('end < start', () => {
    // This case checks that we don't cause an infinite loop
    assert.deepEqual([...range(2, 1)], []);
  });

  test('custom step', () => {
    assert.deepEqual([...range(0, 10, 3)], [0, 3, 6, 9]);
  });

  test('negative step', () => {
    assert.deepEqual([...range(0, -3, -1)], [0, -1, -2]);
    // This case checks that we don't cause an infinite loop
    assert.deepEqual([...range(0, 10, -1)], []);
  });
});
