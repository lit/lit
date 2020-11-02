/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as fsExtra from 'fs-extra';
import * as pathLib from 'path';
import {KnownError} from './error';
import {escapeStringToEmbedInTemplateLiteral} from './typescript';

export type Locale = string & {__TYPE__: 'Locale'};

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
