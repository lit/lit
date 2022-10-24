/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {LitCli} from '../lib/lit-cli.js';
import {LitConsole} from '../lib/console.js';
import {BufferedWritable, symlinkAllCommands} from './cli-test-utils.js';
import {ReferenceToCommand} from '../lib/command.js';
import {ConsoleConstructorOptions} from 'console';
import * as stream from 'stream';
import {suite} from './uvu-wrapper.js';
import {FilesystemTestRig} from '@lit-internal/tests/utils/filesystem-test-rig.js';

interface TestContext {
  console: TestConsole;
  stdin: NodeJS.ReadableStream;
  stdinLines: string[];
  fs: FilesystemTestRig;
}

const test = suite<TestContext>();

class TestConsole extends LitConsole {
  readonly outputStream;
  readonly errorStream;
  constructor(opts: Partial<ConsoleConstructorOptions> = {}) {
    const outputStream = new BufferedWritable();
    const errorStream = new BufferedWritable();
    super({...opts, stdout: outputStream, stderr: errorStream});
    this.outputStream = outputStream;
    this.errorStream = errorStream;
  }
}

test.before.each(async (ctx) => {
  ctx.console = new TestConsole();
  ctx.fs = new FilesystemTestRig();
  // To use, push your input into stdinLines before it would be read.
  ctx.stdinLines = [];
  ctx.stdin = stream.Readable.from(ctx.stdinLines);
  await ctx.fs.setup();
});

test.after.each(async (ctx) => {
  await ctx.fs.cleanup();
});

test('help with no command', async ({fs, console, stdin}) => {
  const cli = new LitCli(['help'], {console, stdin: stdin, cwd: fs.rootDir});
  await cli.run();

  const output = console.outputStream.text;

  assert.snapshot(console.errorStream.text, '');
  assert.match(output, 'Lit CLI');
  assert.match(output, 'Available Commands');
  assert.match(output, 'localize');
});

test('help with localize command', async ({fs, console, stdin}) => {
  await symlinkAllCommands(fs);
  const cli = new LitCli(['help', 'localize'], {
    console,
    stdin,
    cwd: fs.rootDir,
  });
  await cli.run();

  const output = console.outputStream.text;

  assert.match(output, 'lit localize');
  assert.match(output, 'Sub-Commands');
  assert.match(output, 'extract');
  assert.match(output, 'build');
});

test('help with localize extract command', async ({fs, console, stdin}) => {
  await symlinkAllCommands(fs);
  const cli = new LitCli(['help', 'localize', 'extract'], {
    console,
    stdin,
    cwd: fs.rootDir,
  });
  await cli.run();

  const output = console.outputStream.text;

  assert.snapshot(console.errorStream.text, '');
  assert.match(output, 'lit localize extract');
  assert.match(output, '--config');
});

const fooCommandReference: ReferenceToCommand = {
  kind: 'reference',
  name: 'foo',
  description: 'This is the description in the `foo` reference.',
  importSpecifier: 'foo-package-name',
};

test('help includes unresolved external command descriptions', async ({
  console,
  fs,
  stdin,
}) => {
  const cli = new LitCli(['help'], {
    console,
    cwd: fs.rootDir,
    stdin,
  });
  cli.addCommand(fooCommandReference);
  await cli.run();
  const output = console.outputStream.text;
  assert.snapshot(console.errorStream.text, '');
  assert.match(
    output,
    /\s+foo\s+This is the description in the `foo` reference./
  );
});

test(`help fails when getting details of unresolved external command`, async ({
  console,
  fs,
  stdin,
  stdinLines,
}) => {
  stdinLines.push('N\n'); // don't give permission to install
  const cli = new LitCli(['help', 'foo'], {
    console,
    cwd: fs.rootDir,
    stdin: stdin,
  });
  cli.addCommand(fooCommandReference);
  await cli.run();
  assert.equal(console.errorStream.text, `'foo' wasn't installed.\n`);
  assert.equal(
    console.outputStream.text,
    `
The command foo is not installed.
Run 'npm install --save-dev foo-package-name'? [Y/n]\n`.trimStart()
  );
});

test(`help for a resolved external command`, async ({console, fs, stdin}) => {
  await fs.write({
    'node_modules/foo-package-name/index.js': `
      export function getCommand() {
        return {
          kind: 'resolved',
          name: 'foo',
          description: 'this is the resolved foo command from the node_modules directory',
          run() {
            globalThis.resolvedFooCommandHasRun = true;
          }
        };
      };
    `,
    'node_modules/foo-package-name/package.json': {
      type: 'module',
      main: 'index.js',
    },
  });

  let cli = new LitCli(['help', 'foo'], {
    console,
    cwd: fs.rootDir,
    stdin,
  });
  cli.addCommand(fooCommandReference);
  await cli.run();
  let output = console.outputStream.text;
  assert.equal(console.errorStream.text, '');
  assert.match(output, 'lit foo');
  assert.match(
    output,
    `this is the resolved foo command from the node_modules directory`
  );

  console = new TestConsole();
  cli = new LitCli(['help'], {
    console,
    cwd: fs.rootDir,
    stdin,
  });
  cli.addCommand(fooCommandReference);
  await cli.run();
  output = console.outputStream.text;
  assert.snapshot(console.errorStream.text, '');
  assert.match(
    output,
    /\s+foo\s+this is the resolved foo command from the node_modules directory/
  );
});

test('we install a referenced command with permission', async ({
  console,
  fs,
  stdin,
  stdinLines,
}) => {
  await fs.write({
    'working-dir/package.json': {},
    'foo-package/index.js': `
      export function getCommand() {
        return {
          kind: 'resolved',
          name: 'foo',
          description: 'this is the resolved foo command from the node_modules directory',
          run() {
            globalThis.resolvedFooCommandHasRun = true;
          }
        };
      };
    `,
    'foo-package/package.json': {
      name: 'foo-package-name',
      type: 'module',
      main: 'index.js',
    },
  });
  stdinLines.push('Y\n'); // give permission to install
  const cli = new LitCli(['help', 'foo'], {
    console,
    stdin,
    cwd: fs.resolve('working-dir'),
  });
  cli.addCommand({...fooCommandReference, installFrom: '../foo-package'});
  await cli.run();
  assert.snapshot(console.errorStream.text, '');
  // The npm install happened.
  assert.match(console.outputStream.text, 'added 1 package');
  // After installation, we were able to resolve the command.
  assert.match(
    console.outputStream.text,
    'this is the resolved foo command from the node_modules directory'
  );
});

test.run();
