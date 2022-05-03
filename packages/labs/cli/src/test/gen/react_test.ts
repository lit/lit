/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {LitCli} from '../../lib/lit-cli.js';
import {suite} from '../uvu-wrapper.js';
import {TestConsole} from '../cli-test-utils.js';
import {FilesystemTestRig} from 'tests/utils/filesystem-test-rig.js';

interface TestContext {
  rig: FilesystemTestRig;
  console: TestConsole;
}

const test = suite<TestContext>();

test.before(async (ctx) => {
  const rig = new FilesystemTestRig();
  await rig.setup();
  ctx.rig = rig;
  ctx.console = new TestConsole();
});

test.after(async ({rig}) => {
  await rig.cleanup();
});

test('basic wrapper generation', async ({rig, console}) => {
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
      rig.rootDir,
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
  const wrapperSourceFile = await rig.read(
    outputPackage,
    'src/element-a.ts'
  );
  assert.ok(wrapperSourceFile.length > 0);
});

test.run();
