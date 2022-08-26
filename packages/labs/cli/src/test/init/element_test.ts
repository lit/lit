/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {LitCli} from '../../lib/lit-cli.js';
import {suite} from '../uvu-wrapper.js';
import {FilesystemTestRig} from '@lit-internal/tests/utils/filesystem-test-rig.js';
import {symlinkAllCommands, TestConsole} from '../cli-test-utils.js';
import {assertGoldensMatch} from '@lit-internal/tests/utils/assert-goldens.js';
import path from 'path';

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

test('element generation default', async ({rig, testConsole}) => {
  await symlinkAllCommands(rig);
  const cli = new LitCli(['init', 'element'], {
    cwd: rig.rootDir,
    console: testConsole,
  });
  testConsole.alsoLogToGlobalConsole = true;
  await cli.run();

  assert.equal(testConsole.errorStream.buffer.join(''), '');

  await assertGoldensMatch(
    path.join(rig.rootDir, 'my-element'),
    path.join('test_goldens/init', 'js'),
    {
      noFormat: true,
    }
  );
});

test('element generation named', async ({rig, testConsole}) => {
  await symlinkAllCommands(rig);
  const cli = new LitCli(['init', 'element', '--name', 'le-element'], {
    cwd: rig.rootDir,
    console: testConsole,
  });
  testConsole.alsoLogToGlobalConsole = true;
  await cli.run();

  assert.equal(testConsole.errorStream.buffer.join(''), '');

  await assertGoldensMatch(
    path.join(rig.rootDir, 'le-element'),
    path.join('test_goldens/init', 'js-named'),
    {
      noFormat: true,
    }
  );
});

test('element generation TS named', async ({rig, testConsole}) => {
  await symlinkAllCommands(rig);
  const cli = new LitCli(
    ['init', 'element', '--name', 'el-element', '--lang', 'ts'],
    {
      cwd: rig.rootDir,
      console: testConsole,
    }
  );
  testConsole.alsoLogToGlobalConsole = true;
  await cli.run();

  assert.equal(testConsole.errorStream.buffer.join(''), '');

  await assertGoldensMatch(
    path.join(rig.rootDir, 'el-element'),
    path.join('test_goldens/init', 'ts-named'),
    {
      noFormat: true,
    }
  );
});

test.run();
