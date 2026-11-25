/**
 * @license
 * Copyright The Lit Project Contributors.
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {CSS} from '@lit-labs/ssr-dom-shim';

const test = suite('CSS');

test('is installed on globalThis', () => {
  assert.is(globalThis.CSS, CSS);
});

test('escape() serializes identifiers', () => {
  const cases: Array<[string, string]> = [
    ['', ''],
    ['color', 'color'],
    ['background-color', 'background-color'],
    ['-webkit-appearance', '-webkit-appearance'],
    ['--my-prop', '--my-prop'],
    ['--$bar-fill-ratio', '--\\$bar-fill-ratio'],
    ['--a b', '--a\\ b'],
    ['--a.b:c', '--a\\.b\\:c'],
    ['--a\\b', '--a\\\\b'],
    ['--ünï😀', '--ünï😀'],
    ['_a', '_a'],
    // Control characters are hex escaped, NULL is replaced.
    ['a\0b', 'a�b'],
    ['a\x01b', 'a\\1 b'],
    ['a\x1fb', 'a\\1f b'],
    ['a\x7fb', 'a\\7f b'],
    // A leading digit, or a digit after a leading dash, is hex escaped.
    ['1a', '\\31 a'],
    ['-1a', '-\\31 a'],
    ['--1a', '--1a'],
    ['a1', 'a1'],
    // A lone dash is escaped.
    ['-', '\\-'],
    ['--', '--'],
  ];
  for (const [ident, expected] of cases) {
    assert.is(CSS.escape(ident), expected, JSON.stringify(ident));
  }
});

test.run();
