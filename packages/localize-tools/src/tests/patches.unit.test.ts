/** @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'node:test';
import * as assert from 'node:assert';
import {applyPatches, type Patches} from '../patches.js';
import type {Locale} from '../types/locale.js';

test('no patches', () => {
  const got = applyPatches({}, 'es-419' as Locale, 'greeting', 'Hola Mundo');
  assert.strictEqual(got, 'Hola Mundo');
});

test('no patches for locale', () => {
  const patches: Patches = {
    fr: {
      greeting: [{before: 'Bonjour', after: 'Salut'}],
    },
  };
  const got = applyPatches(
    patches,
    'es-419' as Locale,
    'greeting',
    'Hola Mundo'
  );
  assert.strictEqual(got, 'Hola Mundo');
});

test('no patches for message', () => {
  const patches: Patches = {
    'es-419': {
      farewell: [{before: 'Adios', after: 'Adiós'}],
    },
  };
  const got = applyPatches(
    patches,
    'es-419' as Locale,
    'greeting',
    'Hola Mundo'
  );
  assert.strictEqual(got, 'Hola Mundo');
});

test('single patch', () => {
  const patches: Patches = {
    'es-419': {
      greeting: [{before: 'Buenos dias', after: 'Buenos días'}],
    },
  };
  const got = applyPatches(
    patches,
    'es-419' as Locale,
    'greeting',
    'Buenos dias'
  );
  assert.strictEqual(got, 'Buenos días');
});

test('multiple patches for same message', () => {
  const patches: Patches = {
    'es-419': {
      greeting: [
        {before: 'Buenos dias', after: 'Buenos días'},
        {before: 'amigo', after: 'amig@'},
      ],
    },
  };
  const got = applyPatches(
    patches,
    'es-419' as Locale,
    'greeting',
    'Buenos dias amigo'
  );
  assert.strictEqual(got, 'Buenos días amig@');
});

test('patch replaces all occurrences', () => {
  const patches: Patches = {
    'es-419': {
      greeting: [{before: 'aa', after: 'b'}],
    },
  };
  const got = applyPatches(patches, 'es-419' as Locale, 'greeting', 'aaaaaa');
  assert.strictEqual(got, 'bbb');
});
