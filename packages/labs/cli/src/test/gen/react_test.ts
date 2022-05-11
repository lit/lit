/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {LitCli} from '../../lib/lit-cli.js';
import {TestConsole} from '../cli-test-utils.js';
import * as path from 'path';
import {FilesystemTestRig} from 'tests/utils/filesystem-test-rig.js';

interface TestContext {
  tempFs: FilesystemTestRig;
  console: TestConsole;
}

const test = suite<TestContext>();

test.before(async (ctx) => {
  ctx.tempFs = new FilesystemTestRig();
  await ctx.tempFs.setup();
  ctx.console = new TestConsole();
});

test.after(async ({tempFs}) => {
  await tempFs.cleanup();
});

test('basic wrapper generation', async ({tempFs, console}) => {
  const packageName = 'test-element-a';
  const inputDir = path.join('../test-projects/', packageName);
  const outputPackage = packageName + '-react';

  const cli = new LitCli(
    [
      'labs',
      'gen',
      '--framework',
      'react',
      '--package',
      inputDir,
      '--out',
      tempFs.rootDir,
    ],
    {
      console,
    }
  );
  await cli.run();

  assert.equal(console.errorStream.buffer.length, 0);

  // Note, this is only a very basic test that wrapper generation succeeds when
  // executed via the CLI. For detailed tests, see tests in
  // @lit-labs/gen-wrapper-react.
  const wrapperSourceFile = await tempFs.read(
    outputPackage,
    'src/element-a.ts'
  );
  assert.ok(wrapperSourceFile.length > 0);
});

test.run();
