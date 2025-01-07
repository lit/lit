/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {readFileSync} from 'node:fs';
import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import '@lit-labs/ssr-dom-shim';

// The CSS file is not copied/transpiled to the test directory.
import example from '../src/test/example.css' with {type: 'css'};

const test = suite('CSSStyleSheet hook');

const textFromStyleSheet = (sheet: CSSStyleSheet) => {
  return Array.from({length: sheet.cssRules.length})
    .map((_, i) => sheet.cssRules.item(i)?.cssText ?? '')
    .join('\n');
};
const rule = readFileSync(
  // The CSS file is not copied/transpiled to the test directory.
  new URL('../src/test/example.css', import.meta.url),
  'utf8'
);

test('load CSS file via dynamic import', async () => {
  // The CSS file is not copied/transpiled to the test directory.
  const sheet = await import('../src/test/example.css', {
    with: {type: 'css'},
  });

  assert.equal(
    textFromStyleSheet(sheet.default),
    rule,
    'Expected sheet to contain rule from referenced CSS file'
  );
});

test('load CSS file via static import', async () => {
  assert.equal(
    textFromStyleSheet(example),
    rule,
    'Expected sheet to contain rule from referenced CSS file'
  );
});

test('load CSS file with special characters', async () => {
  // The CSS file is not copied/transpiled to the test directory.
  const sheet = await import(
    '../src/test/example-with-special-characters.css',
    {
      with: {type: 'css'},
    }
  );
  const rule = readFileSync(
    new URL('../src/test/example-with-special-characters.css', import.meta.url),
    'utf8'
  );

  assert.equal(
    textFromStyleSheet(sheet.default),
    rule,
    'Expected sheet to contain rule from referenced CSS file'
  );
});

test('should fail without import attributes', async () => {
  try {
    // The CSS file is not copied/transpiled to the test directory.
    await import('../src/test/example.css');
    assert.unreachable(
      'The import without import attributes should have thrown'
    );
  } catch (e) {
    assert.ok('Threw as expected');
  }
});

test.run();
