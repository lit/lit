/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Test with `npm run test -w @lit-labs/compiler`.
 *
 * Update goldens with: `npm run update-goldens -w @lit-labs/compiler`.
 */

import ts from 'typescript';
import {compileLitTemplates} from '@lit-labs/compiler';
import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {existsSync, readdirSync} from 'fs';
import {readFile, writeFile} from 'fs/promises';
import * as url from 'url';
import * as path from 'path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const TEST_FILES_DIR = path.resolve(__dirname, '../test_files');
const UPDATE_GOLDENS = process.env['UPDATE_LIT_COMPILER_GOLDENS'] === 'true';
if (UPDATE_GOLDENS) {
  const resetColor = '\x1b[0m';
  const green = '\x1b[32m';
  const underscore = '\x1b[4m';
  const bold = '\x1b[1m';
  console.log(
    `${green}${underscore}${bold}Updating @lit-labs/compiler goldens${resetColor}`
  );
}

for (const file of readdirSync(TEST_FILES_DIR, {withFileTypes: true})) {
  if (file.isDirectory()) {
    continue;
  }

  if (file.name.includes('.golden.') || file.name.endsWith('.json')) {
    continue;
  }

  const filename = file.name;
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const testGoldenFilename = `${base}.golden.js`;
  const resolvedPath = path.resolve(TEST_FILES_DIR, filename);
  const resolvedGoldenFilename = path.resolve(
    TEST_FILES_DIR,
    testGoldenFilename
  );
  test(filename, async () => {
    // Create an empty golden file if it does not exist.
    if (UPDATE_GOLDENS && !existsSync(resolvedGoldenFilename)) {
      await writeFile(resolvedGoldenFilename, '');
    }

    const [inputFileContents, expectedContents] = await Promise.all([
      readFile(resolvedPath, {encoding: 'utf-8'}),
      readFile(resolvedGoldenFilename, {encoding: 'utf-8'}),
    ]);

    const result = ts.transpileModule(inputFileContents, {
      compilerOptions: {
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ES2020,
      },
      transformers: {before: [compileLitTemplates()]},
    });

    // Update golden file contents
    if (UPDATE_GOLDENS && result.outputText !== expectedContents) {
      console.log('Updating golden: ', testGoldenFilename);
      await writeFile(resolvedGoldenFilename, result.outputText);
      return;
    }

    assert.fixture(result.outputText, expectedContents);
  });
}

test.run();
