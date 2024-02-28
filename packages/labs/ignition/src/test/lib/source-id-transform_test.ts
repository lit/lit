/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Test with `npm run test -w @lit-labs/ignition`.
 *
 * Update goldens with: `npm run update-goldens -w @lit-labs/ignition`.
 */

import ts from 'typescript';
import {addSourceIds} from '../../lib/source-id-transform.js';
import {test, describe as suite} from 'node:test';
import * as assert from 'node:assert';
import {existsSync, readdirSync} from 'fs';
import {readFile, writeFile} from 'fs/promises';
import * as url from 'url';
import * as path from 'path';

type TypeScript = typeof ts;

const testFilesDir = url.fileURLToPath(
  new URL('../../test_files', import.meta.url)
);
const updateGoldens = process.env['UPDATE_IGNITION_GOLDENS'] === 'true';

if (updateGoldens) {
  const resetColor = '\x1b[0m';
  const green = '\x1b[32m';
  const underscore = '\x1b[4m';
  const bold = '\x1b[1m';
  console.log(
    `${green}${underscore}${bold}Updating @lit-labs/ignition goldens${resetColor}`
  );
}

const transform = (filename: string) => {
  const program = ts.createProgram({
    rootNames: [filename],
    options: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(filename);
  let transformedSource!: string | undefined;
  program.emit(
    sourceFile,
    (fileName, data) => {
      if (fileName.endsWith('.js')) {
        transformedSource = data;
      }
    },
    undefined,
    false,
    {
      after: [addSourceIds(ts, checker)],
    }
  );
  return transformedSource;
};

suite('source-id-transform', () => {
  for (const file of readdirSync(testFilesDir, {withFileTypes: true})) {
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
    const resolvedPath = path.resolve(testFilesDir, filename);
    const resolvedGoldenFilename = path.resolve(
      testFilesDir,
      testGoldenFilename
    );

    test(filename, async () => {
      // Create an empty golden file if it does not exist.
      if (updateGoldens && !existsSync(resolvedGoldenFilename)) {
        await writeFile(resolvedGoldenFilename, '');
      }

      const result = transform(resolvedPath);

      assert.ok(result);

      const expectedContents = await readFile(resolvedGoldenFilename, {
        encoding: 'utf-8',
      });

      // Update golden file contents
      if (updateGoldens && result !== expectedContents) {
        console.log('Updating golden: ', testGoldenFilename);
        await writeFile(resolvedGoldenFilename, result);
        return;
      }

      assert.equal(result, expectedContents);
    });
  }
});
