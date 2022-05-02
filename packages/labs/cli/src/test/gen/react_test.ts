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

let outputStream: BufferedWritable;
let errorStream: BufferedWritable;
let cliConsole: LitConsole;

test.before(() => {
  fs.rmdirSync('./test-gen', {recursive: true});
  outputStream = new BufferedWritable();
  errorStream = new BufferedWritable();
  cliConsole = new LitConsole({
    stdout: outputStream,
    stderr: errorStream,
  });
});

test('stub test', async () => {
  const cli = new LitCli(
    [
      'labs',
      'gen',
      '--framework',
      'react',
      '--package',
      'test-project',
      '--out',
      './test-gen',
    ],
    {
      console: cliConsole,
    }
  );
  await cli.run();

  assert.equal(errorStream.buffer.length, 0);

  const wrapperFile = fs.readFileSync(
    './test-gen/test-project-react/src/element-a.ts'
  );
  assert.ok(wrapperFile.length > 0);

  // TODO(kschaaf): Add npm install, build, link monorepo packages, and then
  // some sort of test of the generated files
});
