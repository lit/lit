/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import litCompilerPlugin from '../lib/rollup-plugin-compiler.js';
import {SourceMapConsumer} from 'source-map';

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {readFile, writeFile} from 'fs/promises';
import * as url from 'url';
import * as path from 'path';
import {SourceDescription, TransformPluginContext} from 'rollup';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const TEST_FILES_DIR = path.resolve(__dirname, '../test_files/source_map_test');

function rollupTransform(
  inputFileContents: string,
  filename: string
): {code: string; map: string} {
  const plugin = litCompilerPlugin();
  const transform = plugin.transform;
  if (!transform) {
    throw new Error(`Expectation is that our plugin provides a transform`);
  }
  if (typeof transform !== 'function') {
    throw new Error(`transform should be a function`);
  }
  const {code, map} = transform.apply({} as TransformPluginContext, [
    inputFileContents,
    filename,
  ]) as Partial<SourceDescription>;
  if (!code || !map) {
    throw new Error(
      `Expected both a 'code' and 'map' returned from the compiler transform.`
    );
  }
  if (typeof map !== 'string') {
    throw new Error(`Expected map to be a string`);
  }
  return {code, map};
}

/**
 * This helper asserts that a given position in the compiled file maps to a
 * specific position in the authored file.
 *
 * To write these tests, use the editor to inspect line and column numbers in
 * the source_map_test directory.
 *
 * @param smc SourceMapConsumer
 * @param generatedPosition The [line, column] for the generatedPosition.
 * @param authoredPosition The [line, column] for the authoredPosition. May be
 * null if there is no mapping.
 */
const assertSourceMapLocationMapping = (
  smc: SourceMapConsumer,
  generatedPosition: [number, number],
  authoredPosition: [number | null, number | null]
) => {
  const result = smc.originalPositionFor({
    line: generatedPosition[0],
    column: generatedPosition[1],
  });

  assert.is(result.line, authoredPosition[0]);
  assert.is(result.column, authoredPosition[1]);
};

const setupTest = async (
  filename: string,
  compiledFilename: string
): Promise<SourceMapConsumer> => {
  const resolvedPath = path.resolve(TEST_FILES_DIR, filename);
  const compiledPath = path.resolve(TEST_FILES_DIR, compiledFilename);
  const inputFileContents = await readFile(resolvedPath, {encoding: 'utf-8'});
  const {code, map} = rollupTransform(inputFileContents, filename);
  const smc = await new SourceMapConsumer(map);
  // Write out the compiled file (it's gitignored), so that it is
  // easy to update the test by inspecting the line/column location
  // for compiled -> authored code.
  await writeFile(path.resolve(TEST_FILES_DIR, compiledPath), code);
  return smc;
};

test('basic.ts', async () => {
  const smc = await setupTest('basic.ts', 'basic.compiled.js');

  // Assert that 'name' in compiled `values: [name, '!']` maps to `${name}`.
  assertSourceMapLocationMapping(smc, [4, 81], [3, 21]);
  // Assert that 'sayHello' identifier maps to authored location.
  assertSourceMapLocationMapping(smc, [4, 21], [2, 21]);
  // Assert that the preparedHtml maps to null.
  assertSourceMapLocationMapping(smc, [3, 12], [null, null]);
});

test.run();
