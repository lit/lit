/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {CSSStyleSheet} from '@lit-labs/ssr-dom-shim';

const test = suite('CSSStyleSheet');

const textFromStyleSheet = (sheet: CSSStyleSheet) => {
  return Array.from({length: sheet.cssRules.length})
    .map((_, i) => sheet.cssRules.item(i)?.cssText ?? '')
    .join('\n');
};

test('add rule via replaceSync', () => {
  const rule = '.test { color: red; }';
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(rule);

  assert.equal(
    textFromStyleSheet(sheet),
    rule,
    'Expected sheet to contain replaced rule'
  );
});

test('add rule via replace', async () => {
  const rule = '.test { color: red; }';
  const sheet = new CSSStyleSheet();
  const returnedSheet = await sheet.replace(rule);

  assert.is(returnedSheet, sheet);
  assert.equal(
    textFromStyleSheet(sheet),
    rule,
    'Expected sheet to contain replaced rule'
  );
});

test.run();
