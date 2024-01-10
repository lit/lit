/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {SourceMapConsumer} from 'source-map';

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {readFile} from 'fs/promises';
import * as url from 'url';
import * as path from 'path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const TEST_FILES_DIR = path.resolve(
  __dirname,
  '../test_files/source_map_tests'
);

/**
 * This helper asserts that a given position in the compiled file maps to a
 * specific position in the authored file.
 *
 * To write these tests, use the editor to inspect line and column numbers in
 * the source_map_tests directory.
 *
 * @param smc SourceMapConsumer
 * @param generatedPosition The [line, column] for the generatedPosition.
 * @param authoredPosition The [line, column] for the authoredPosition. May be
 * null if there is no mapping.
 */
const assertSourceMapLocationMapping = ({
  smc,
  generatedPosition,
  authoredPosition,
  msg,
}: {
  smc: SourceMapConsumer;
  generatedPosition: [number, number];
  authoredPosition: [number | null, number | null];
  msg: string;
}) => {
  const result = smc.originalPositionFor({
    line: generatedPosition[0],
    column: generatedPosition[1],
  });

  assert.equal([result.line, result.column], authoredPosition, msg);
};

const setupTest = async (filename: string): Promise<SourceMapConsumer> => {
  const resolvedSourcemapPath = path.resolve(TEST_FILES_DIR, filename);
  const map = await readFile(resolvedSourcemapPath, {encoding: 'utf-8'});
  const smc = await new SourceMapConsumer(map);
  return smc;
};

test('basic.ts', async () => {
  const smc = await setupTest('basic.js.map');

  // const sayHello = (name) => ({ ["_$litType$"]: lit_template_1, values: [name, '!'] });
  //                                                                         ^
  assertSourceMapLocationMapping({
    smc,
    generatedPosition: [10, 74],
    authoredPosition: [7, 59],
    msg: "Identifier 'name' in `[name, '!']` maps to `${name}`",
  });
  // const sayHello = (name) => ({ ["_$litType$"]: lit_template_1, values: [name, '!'] });
  //         ^
  assertSourceMapLocationMapping({
    smc,
    generatedPosition: [10, 10],
    authoredPosition: [7, 13],
    msg: "'sayHello' identifier declaration maps to authored declaration",
  });
  // const lit_template_1 = { h: b_1 `<h1>Hello <?><?></h1>`, parts: [{ type: 2, index: 1 }, { type: 2, index: 2 }] };
  //                                    ^
  assertSourceMapLocationMapping({
    smc,
    generatedPosition: [9, 37],
    authoredPosition: [null, null],
    msg: 'The generated prepared HTML does not map to any authored source',
  });

  smc.destroy();
});

test.run();
