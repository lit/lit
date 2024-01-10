/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as pathlib from 'path';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {LitCli} from '../../lib/lit-cli.js';
import {suite} from '../uvu-wrapper.js';
import {FilesystemTestRig} from '@lit-internal/tests/utils/filesystem-test-rig.js';
import {symlinkAllCommands, TestConsole} from '../cli-test-utils.js';

interface TestContext {
  testConsole: TestConsole;
  rig: FilesystemTestRig;
}

const test = suite<TestContext>();

test.before.each(async (ctx) => {
  const rig = new FilesystemTestRig();
  await rig.setup();
  ctx.rig = rig;
  ctx.testConsole = new TestConsole();
});

test.after.each(async ({rig}) => {
  await rig.cleanup();
});

test('basic wrapper generation', async ({rig, testConsole}) => {
  const packageName = 'test-element-a';
  const inputPackage = pathlib.join('..', 'test-projects', packageName);
  const outputPackage = pathlib.join(rig.rootDir, packageName + '-react');

  await symlinkAllCommands(rig);
  const cli = new LitCli(
    [
      'labs',
      'gen',
      '--framework',
      'react',
      '--package',
      inputPackage,
      '--out',
      rig.rootDir,
    ],
    {
      cwd: rig.rootDir,
      console: testConsole,
    }
  );
  testConsole.alsoLogToGlobalConsole = true;
  await cli.run();

  assert.snapshot(testConsole.errorStream.text, '');

  // Note, this is only a very basic test that wrapper generation succeeds when
  // executed via the CLI. For detailed tests, see tests in
  // @lit-labs/gen-wrapper-react.
  const wrapperSourceFile = await rig.read(
    outputPackage,
    'src',
    'element-a.ts'
  );
  assert.ok(wrapperSourceFile.length > 0);
});

test.run();
