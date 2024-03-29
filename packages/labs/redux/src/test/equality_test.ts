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

  test('arrays', () => {
    assert.isTrue(shallowEquals([1], [1]));
    assert.isFalse(shallowEquals([1], [2]));
    assert.isFalse(shallowEquals([[]], [[]]));
  });
});
