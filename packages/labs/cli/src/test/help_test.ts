/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {LitCli} from '../lib/lit-cli.js';
import {LitConsole} from '../lib/console.js';
import {BufferedWritable} from './buffered-writable.js';

let outputStream: BufferedWritable;
let errorStream: BufferedWritable;
let cliConsole: LitConsole;

test.before(() => {
  outputStream = new BufferedWritable();
  errorStream = new BufferedWritable();
  cliConsole = new LitConsole({
    stdout: outputStream,
    stderr: errorStream,
  });
});

test('help with no command', async () => {
  const cli = new LitCli(['help'], {console: cliConsole});
  await cli.run();

  const output = outputStream.text;

  assert.equal(errorStream.buffer.length, 0);
  assert.match(output, 'Lit CLI');
  assert.match(output, 'Available Commands');
  assert.match(output, 'localize');
});

test('help with localize command', async () => {
  const cli = new LitCli(['help', 'localize'], {console: cliConsole});
  await cli.run();

  const output = outputStream.text;

  assert.equal(errorStream.buffer.length, 0);
  assert.match(output, 'lit localize');
  assert.match(output, 'Sub-Commands');
  assert.match(output, 'extract');
  assert.match(output, 'build');
});

test('help with localize extract command', async () => {
  const cli = new LitCli(['help', 'localize', 'extract'], {
    console: cliConsole,
  });
  await cli.run();

  const output = outputStream.text;

  assert.equal(errorStream.buffer.length, 0);
  assert.match(output, 'lit localize extract');
  assert.match(output, '--config');
});

test.run();
