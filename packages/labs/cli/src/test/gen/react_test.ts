/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {LitCli} from '../../lib/lit-cli.js';
import {suite} from '../uvu-wrapper.js';
import {TestConsole} from '../cli-test-utils.js';
import {FilesystemTestRig} from 'tests/utils/filesystem-test-rig.js';

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
  const inputPackage = path.join('../test-projects/', packageName);
  const outputPackage = path.join(rig.rootDir, packageName + '-react');

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
      console: testConsole,
    }
  );
  testConsole.alsoLogToGlobalConsole = true;
  await cli.run();

  assert.equal(testConsole.errorStream.buffer.length, 0);

  // Note, this is only a very basic test that wrapper generation succeeds when
  // executed via the CLI. For detailed tests, see tests in
  // @lit-labs/gen-wrapper-react.
  const wrapperSourceFile = await rig.read(outputPackage, 'src/element-a.ts');
  assert.ok(wrapperSourceFile.length > 0);
});

test.run();
