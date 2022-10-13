/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';

type Language = 'ts' | 'js';

export const languages: Language[] = ['ts', 'js'];

// Note these functions assume a specific setup in tsconfig.json for tests of TS
// projects using these helpers, namely that the `rootDir` is 'src' and the
// `outDir` is 'out'

export const getSourceFilename = (f: string, lang: Language) =>
  lang === 'ts' ? path.join('src', f + '.ts') : f + '.js';

export const getOutputFilename = (f: string, lang: Language) =>
  lang === 'ts' ? path.join('out', f + '.js') : f + '.js';
