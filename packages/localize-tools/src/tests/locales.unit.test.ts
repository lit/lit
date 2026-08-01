/** @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'node:test';
import * as assert from 'node:assert';
import {mkdtempSync, readFileSync, rmSync} from 'fs';
import {tmpdir} from 'os';
import path from 'path';

import {isLocale, writeLocaleCodesModule} from '../locales.js';

// TestIsLocale

const isLocaleTests: Array<{name: string; in: string; want: boolean}> = [
  {name: 'simple language code', in: 'en', want: true},
  {name: 'language with region', in: 'es-419', want: true},
  {name: 'language with script and region', in: 'zh-Hans-CN', want: true},
  {name: 'empty string', in: '', want: false},
  {name: 'starts with hyphen', in: '-en', want: false},
  {name: 'ends with hyphen', in: 'en-', want: false},
  {name: 'double hyphen', in: 'en--US', want: false},
  {name: 'contains space', in: 'en US', want: false},
  {name: 'contains underscore', in: 'zh_CN', want: false},
  {name: 'contains dot', in: 'en.US', want: false},
];

for (const tt of isLocaleTests) {
  test(`isLocale: ${tt.name}`, () => {
    const got = isLocale(tt.in);
    assert.strictEqual(got, tt.want, `isLocale(${JSON.stringify(tt.in)})`);
  });
}

// TestGenerateLocaleCodesModule

test('writeLocaleCodesModule: TypeScript module', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'locales-test-'));
  try {
    const filePath = path.join(dir, 'locale-codes.ts');
    await writeLocaleCodesModule('en', ['es-419', 'zh-Hans'], filePath);
    const got = readFileSync(filePath, 'utf8');
    const want = `// Do not modify this file by hand!
// Re-generate this file by running lit-localize.

/**
 * The locale code that templates in this source code are written in.
 */
export const sourceLocale = \`en\`;

/**
 * The other locale codes that this application is localized into. Sorted
 * lexicographically.
 */
export const targetLocales = [
  \`es-419\`,
  \`zh-Hans\`,
] as const;

/**
 * All valid project locale codes. Sorted lexicographically.
 */
export const allLocales = [
  \`en\`,
  \`es-419\`,
  \`zh-Hans\`,
] as const;
`;
    assert.strictEqual(got, want);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('writeLocaleCodesModule: JavaScript module', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'locales-test-'));
  try {
    const filePath = path.join(dir, 'locale-codes.js');
    await writeLocaleCodesModule('en', ['es-419', 'zh-Hans'], filePath);
    const got = readFileSync(filePath, 'utf8');
    const want = `// Do not modify this file by hand!
// Re-generate this file by running lit-localize.

/**
 * The locale code that templates in this source code are written in.
 */
export const sourceLocale = \`en\`;

/**
 * The other locale codes that this application is localized into. Sorted
 * lexicographically.
 */
export const targetLocales = [
  \`es-419\`,
  \`zh-Hans\`,
];

/**
 * All valid project locale codes. Sorted lexicographically.
 */
export const allLocales = [
  \`en\`,
  \`es-419\`,
  \`zh-Hans\`,
];
`;
    assert.strictEqual(got, want);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('writeLocaleCodesModule: sorts target locales', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'locales-test-'));
  try {
    const filePath = path.join(dir, 'locale-codes.ts');
    // Target locales should be sorted lexicographically regardless of input
    // order.
    await writeLocaleCodesModule('en', ['zh-Hans', 'es-419'], filePath);
    const got = readFileSync(filePath, 'utf8');
    const want = `// Do not modify this file by hand!
// Re-generate this file by running lit-localize.

/**
 * The locale code that templates in this source code are written in.
 */
export const sourceLocale = \`en\`;

/**
 * The other locale codes that this application is localized into. Sorted
 * lexicographically.
 */
export const targetLocales = [
  \`es-419\`,
  \`zh-Hans\`,
] as const;

/**
 * All valid project locale codes. Sorted lexicographically.
 */
export const allLocales = [
  \`en\`,
  \`es-419\`,
  \`zh-Hans\`,
] as const;
`;
    assert.strictEqual(got, want);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('writeLocaleCodesModule: single target locale', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'locales-test-'));
  try {
    const filePath = path.join(dir, 'locale-codes.ts');
    await writeLocaleCodesModule('en', ['es'], filePath);
    const got = readFileSync(filePath, 'utf8');
    const want = `// Do not modify this file by hand!
// Re-generate this file by running lit-localize.

/**
 * The locale code that templates in this source code are written in.
 */
export const sourceLocale = \`en\`;

/**
 * The other locale codes that this application is localized into. Sorted
 * lexicographically.
 */
export const targetLocales = [
  \`es\`,
] as const;

/**
 * All valid project locale codes. Sorted lexicographically.
 */
export const allLocales = [
  \`en\`,
  \`es\`,
] as const;
`;
    assert.strictEqual(got, want);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('writeLocaleCodesModule: source locale sorts into middle of all locales', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'locales-test-'));
  try {
    const filePath = path.join(dir, 'locale-codes.ts');
    await writeLocaleCodesModule('en', ['ar', 'zh'], filePath);
    const got = readFileSync(filePath, 'utf8');
    const want = `// Do not modify this file by hand!
// Re-generate this file by running lit-localize.

/**
 * The locale code that templates in this source code are written in.
 */
export const sourceLocale = \`en\`;

/**
 * The other locale codes that this application is localized into. Sorted
 * lexicographically.
 */
export const targetLocales = [
  \`ar\`,
  \`zh\`,
] as const;

/**
 * All valid project locale codes. Sorted lexicographically.
 */
export const allLocales = [
  \`ar\`,
  \`en\`,
  \`zh\`,
] as const;
`;
    assert.strictEqual(got, want);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('writeLocaleCodesModule: escapes special characters in locale codes', async () => {
  // Locale codes shouldn't normally contain special characters, but the
  // escaping behavior should still be correct.
  const dir = mkdtempSync(path.join(tmpdir(), 'locales-test-'));
  try {
    const filePath = path.join(dir, 'locale-codes.ts');
    await writeLocaleCodesModule('en', ['x`y'], filePath);
    const got = readFileSync(filePath, 'utf8');
    // The backtick in x`y should be escaped.
    assert.ok(
      got.includes('`x\\`y`'),
      'writeLocaleCodesModule() should escape backtick in locale code'
    );
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});
