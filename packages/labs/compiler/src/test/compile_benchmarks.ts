/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This file builds the various compiled benchmarks.
 *
 * This is temporary while versions of TypeScript are mismatched in the
 * repository.
 *
 */
import * as url from 'url';
import * as path from 'path';
import ts from 'typescript';
import {compileLitTemplates} from '@lit-labs/compiler';
import {readFile, writeFile} from 'fs/promises';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const BENCHMARKS_PKG_PATH = '../../../benchmarks';

const filesToCompile = [
  [
    './lit-html/template-heavy/template-heavy.js',
    './lit-html/template-heavy/template-heavy_compiled.js',
  ],
];

async function main() {
  const compilationPromises = [];
  for (const [from, to] of filesToCompile) {
    const resolvedFrom = path.resolve(__dirname, BENCHMARKS_PKG_PATH, from);
    const resolvedTo = path.resolve(__dirname, BENCHMARKS_PKG_PATH, to);
    compilationPromises.push(
      (async () => {
        const inputFileContents = await readFile(resolvedFrom, {
          encoding: 'utf-8',
        });

        const result = ts.transpileModule(inputFileContents, {
          compilerOptions: {
            target: ts.ScriptTarget.Latest,
            module: ts.ModuleKind.ES2020,
          },
          transformers: {before: [compileLitTemplates()]},
        });
        await writeFile(resolvedTo, result.outputText);
      })()
    );
  }
  await Promise.allSettled(compilationPromises);
}

await main();
