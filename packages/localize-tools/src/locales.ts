/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as fsExtra from 'fs-extra';
import * as pathLib from 'path';
import {KnownError} from './error.js';
import type {Locale} from './types/locale.js';
import {escapeStringToEmbedInTemplateLiteral} from './typescript.js';

/**
 * Return whether the given string is formatted like a BCP 47 language tag. Note
 * we don't currently strictly validate against a known list of codes.
 */
export function isLocale(x: string): x is Locale {
  return x.match(/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/) !== null;
}

const templateLit = (str: string) =>
  '`' + escapeStringToEmbedInTemplateLiteral(str) + '`';

/**
 * Generate a TypeScript module that exports a project's source and target
 * locale codes, and write it to the given file path.
 */
export async function writeLocaleCodesModule(
  sourceLocale: string,
  targetLocales: string[],
  filePath: string
) {
  const targetLocalesArrayContents = [...targetLocales]
    .sort((a, b) => a.localeCompare(b))
    .map(templateLit)
    .join(',\n  ');
  const allLocalesArrayContents = [sourceLocale, ...targetLocales]
    .sort((a, b) => a.localeCompare(b))
    .map(templateLit)
    .join(',\n  ');
  const tsSrc = `// Do not modify this file by hand!
// Re-generate this file by running lit-localize.

/**
 * The locale code that templates in this source code are written in.
 */
export const sourceLocale = ${templateLit(sourceLocale)};

/**
 * The other locale codes that this application is localized into. Sorted
 * lexicographically.
 */
export const targetLocales = [
  ${targetLocalesArrayContents},
] as const;

/**
 * All valid project locale codes. Sorted lexicographically.
 */
export const allLocales = [
  ${allLocalesArrayContents},
] as const;
`;
  const parentDir = pathLib.dirname(filePath);
  try {
    await fsExtra.ensureDir(parentDir);
  } catch (e) {
    throw new KnownError(
      `Error creating locales module directory: ${parentDir}\n` +
        `Do you have write permission?\n` +
        e.message
    );
  }
  try {
    await fsExtra.writeFile(filePath, tsSrc, 'utf8');
  } catch (e) {
    throw new KnownError(
      `Error creating locales module file: ${filePath}\n` +
        `Do you have write permission?\n` +
        e.message
    );
  }
}
