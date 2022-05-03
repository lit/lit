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
import {installPackage, buildPackage} from './utils.js';

let outputStream: BufferedWritable;
let errorStream: BufferedWritable;
let cliConsole: LitConsole;

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
  const inputPackage = 'test-project';
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

  const wrapperFile = fs.readFileSync(
    path.join(outputPackage, '/src/element-a.ts')
  );
  assert.ok(wrapperFile.length > 0);

  await installPackage(outputPackage, {
    'test-project': inputPackage,
    '@lit-labs/react': '../react',
    // TODO(kschaaf): If we don't use the exact version of @types/react that
    // @lit-labs/react does, we get a _fantastic_ amount of type errors from
    // passing an ever-so-slightly-differently typed React into createComponent
    '@types/react': '../react/node_modules/@types/react',
  });

  await buildPackage(outputPackage);
});
