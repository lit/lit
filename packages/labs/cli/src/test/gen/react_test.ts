/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {LitCli} from '../../lib/lit-cli.js';
import {LitConsole} from '../../lib/console.js';
import {BufferedWritable} from '../buffered-writable.js';
import * as fs from 'fs';
import * as path from 'path';

let outputStream: BufferedWritable;
let errorStream: BufferedWritable;
let cliConsole: LitConsole;

// TODO(kschaaf): Use TestFilesystemRig once moved into test utils
const outputFolder = 'test-gen';

test.before(() => {
  if (fs.existsSync(outputFolder)) {
    fs.rmSync(outputFolder, {recursive: true});
  }
  outputStream = new BufferedWritable();
  errorStream = new BufferedWritable();
  cliConsole = new LitConsole({
    stdout: outputStream,
    stderr: errorStream,
  });
});

test('basic wrapper generation', async () => {
  const inputPackage = '../../../test-projects/test-element-a';
  const outputPackage = path.join(outputFolder, inputPackage + '-react');

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
      console: cliConsole,
    }
  );
  await cli.run();

  assert.equal(errorStream.buffer.length, 0);

  // Note, this is only a very basic test that wrapper generation succeeds when
  // executed via the CLI. For detailed tests, see tests in
  // @lit-labs/gen-wrapper-react.
  const wrapperSourceFile = fs.readFileSync(
    path.join(outputPackage, '/src/element-a.ts')
  );
  assert.ok(wrapperSourceFile.length > 0);
});
