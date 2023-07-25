/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

import {compileLitTemplates} from '../lib/template-transform.js';

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {readdirSync} from 'fs';
import {readFile, writeFile} from 'fs/promises';
import * as url from 'url';
import * as path from 'path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const TEST_FILES_DIR = path.resolve(__dirname, '../test_files');

// Set to true & run tests to update golden files.
const updateGoldens = false;

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

    if (updateGoldens && result.outputText.trim() !== expectedContents.trim()) {
      // update the golden
      await writeFile(resolvedGoldenFilename, result.outputText);
    }

    assert.fixture(result.outputText.trim(), expectedContents.trim());
  });
}

test.run();
