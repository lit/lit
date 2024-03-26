/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {choose} from 'lit-html/directives/choose.js';
import {assert} from '@esm-bundle/chai';

suite('choose', () => {
  test('no cases', () => {
    assert.strictEqual(choose(1, []), undefined);
  });

  test('matching cases', () => {
    assert.strictEqual(choose(1, [[1, () => 'A']]), 'A');
    assert.strictEqual(
      choose(2, [
        [1, () => 'A'],
        [2, () => 'B'],
      ]),
      'B'
    );

    const a = {};
    const b = {};
    assert.strictEqual(
      choose(b, [
        [a, () => 'A'],
        [b, () => 'B'],
      ]),
      'B'
    );
  });

  test('default case', () => {
    assert.strictEqual(
      choose(
        3,
        [
          [1, () => 'A'],
          [2, () => 'B'],
        ],
        () => 'C'
      ),
      'C'
    );
  });

  // Type-only regression test of https://github.com/lit/lit/issues/4220
  test.skip('type-only: correctly infers type of possible cases from value', () => {
    type CheckoutStep = 'register' | 'delivery' | 'payment';
    const step = 'register' as CheckoutStep;
    return choose(step, [
      // @ts-expect-error 'test' is not assignable to 'CheckoutStep'
      ['test', () => 1],
      // @ts-expect-error 'random' is not assignable to 'CheckoutStep'
      ['random', () => 2],
      // This should compile fine
      ['register', () => 3],
    ]);
  });
});
