/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {
  javascript,
  toInitialCap,
  kabobToPascalCase,
  kabobToOnEvent,
} from '../lib/str-utils.js';

const javascriptTest = suite('javascript tag');

javascriptTest('string interpolation', () => {
  assert.equal(javascript`foo=${'bar'};\nbaz=${'zot'};`, 'foo=bar;\nbaz=zot;');
});

javascriptTest('nested interpolation', () => {
  assert.equal(javascript`foo=${javascript`(bar=${'zot'})`}`, 'foo=(bar=zot)');
});

javascriptTest('array interpolation', () => {
  const arr = [
    ['a1', 'a2'],
    ['b1', 'b2'],
    ['c1', 'c2'],
  ];
  assert.equal(javascript`foo=${arr.map((arr2) => arr2[0])};`, 'foo=a1b1c1;');
  assert.equal(
    javascript`foo=1${arr.map((arr2) => arr2.map((i) => javascript`*${i}`))};`,
    'foo=1*a1*a2*b1*b2*c1*c2;'
  );
});

javascriptTest.run();

const casingTest = suite('string casing');

casingTest('string to initial capitalized string', () => {
  assert.equal(toInitialCap(''), '');
  assert.equal(toInitialCap('f'), 'F');
  assert.equal(toInitialCap('foo'), 'Foo');
});

casingTest('kabob-case string to PascalCase string', () => {
  assert.equal(kabobToPascalCase('foo-bar'), 'FooBar');
});

casingTest('kabob-case string to event name', () => {
  assert.equal(kabobToOnEvent('foo-bar'), 'onFooBar');
});

casingTest.run();
