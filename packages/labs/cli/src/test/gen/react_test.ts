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
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface TestContext {
  console: TestConsole;
  outputFolder: string;
}

const test = suite<TestContext>();

test.before((ctx) => {
  // TODO(kschaaf): Use FilesystemTestRig once moved into test utils
  ctx.outputFolder = fs.mkdtempSync(
    path.join(os.tmpdir(), 'generateReactTest-')
  );
  if (!ctx.outputFolder) {
    throw new Error(`Failed to create temp dir under ${os.tmpdir()}`);
  }
  ctx.console = new TestConsole();
});

test.after(({outputFolder}) => {
  fs.rmSync(outputFolder, {recursive: true});
});

test('basic wrapper generation', async ({outputFolder, console}) => {
  const packageName = 'test-element-a';
  const inputPackage = path.join('../test-projects/', packageName);
  const outputPackage = path.join(outputFolder, packageName + '-react');

  const cli = new LitCli(
    [
      'labs',
      'gen',
      '--framework',
      'react',
      '--package',
      inputPackage,
      '--out',
      outputFolder,
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
  const wrapperSourceFile = fs.readFileSync(
    path.join(outputPackage, 'src/element-a.ts')
  );
  assert.ok(wrapperSourceFile.length > 0);
});

test.run();
