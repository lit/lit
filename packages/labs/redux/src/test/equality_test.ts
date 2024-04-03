/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';

import {shallowEquals} from '@lit-labs/redux';

suite('shallowEquals', () => {
  test('primitives', () => {
    assert.isTrue(shallowEquals(1, 1));
    assert.isTrue(shallowEquals('1', '1'));
    assert.isTrue(shallowEquals(true, true));
    assert.isNotTrue(shallowEquals(1, 2));
    assert.isNotTrue(shallowEquals('1', '2'));
    assert.isNotTrue(shallowEquals(true, false));
  });

  test('null', () => {
    assert.isTrue(shallowEquals(null, null));
  });

  test('arrays', () => {
    assert.isTrue(shallowEquals([1], [1]));
    assert.isTrue(shallowEquals([1, 2], [1, 2]));
    assert.isFalse(shallowEquals([1], [2]));
    assert.isFalse(shallowEquals([1], [1, 2]));
    assert.isFalse(shallowEquals([[]], [[]]));
  });

  test('objects', () => {
    assert.isTrue(shallowEquals({a: 1}, {a: 1}));
    assert.isTrue(shallowEquals({a: 1, b: 2}, {a: 1, b: 2}));
    assert.isFalse(shallowEquals({a: 1, b: 2}, {a: 2, b: 1}));
    assert.isFalse(shallowEquals({a: 1}, {a: 1, b: 2}));
    assert.isFalse(shallowEquals({a: {}}, {a: {}}));
  });
});
