/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import 'source-map-support/register.js';
import {suite, uvu} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {LitCli} from '../lib/lit-cli.js';
import {LitConsole} from '../lib/console.js';
import {BufferedWritable} from './cli-test-utils.js';
import {ReferenceToCommand} from '../lib/command.js';
import {FilesystemTestRig} from './temp-filesystem-rig.js';
import {ConsoleConstructorOptions} from 'console';
import * as stream from 'stream';
import * as pathlib from 'path';

interface TestContext {
  console: TestConsole;
  stdin: NodeJS.ReadableStream;
  stdinLines: string[];
  fs: FilesystemTestRig;
}

const testBase = suite<TestContext>();

function test(name: string, testImpl: uvu.Callback<TestContext>) {
  testBase(name, timeout(name, 1_000, testImpl));
}

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

/**
 * We don't actually care that much about timing out, this just works around
 * https://github.com/lukeed/uvu/issues/206
 */
function timeout<T>(
  name: string,
  ms: number,
  test: uvu.Callback<T>
): uvu.Callback<T> {
  return async (ctx) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const result = Promise.race([
      test(ctx),
      new Promise<void>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Test timed out: ${JSON.stringify(name)}`)),
          ms
        );
      }),
    ]);
    result.finally(() => {
      clearTimeout(timeoutId);
    });
    return result;
  };
}

testBase.before.each(async (ctx) => {
  ctx.console = new TestConsole();
  ctx.fs = new FilesystemTestRig();
  ctx.stdinLines = [];
  ctx.stdin = stream.Readable.from(ctx.stdinLines);
  await ctx.fs.setup();
});

testBase.after.each(async (ctx) => {
  await ctx.fs.cleanup();
});

test('help with no command', async ({console, stdin}) => {
  const cli = new LitCli(['help'], {console, stdin: stdin});
  await cli.run();

  const output = console.outputStream.text;

  assert.equal(console.errorStream.buffer.length, 0);
  assert.match(output, 'Lit CLI');
  assert.match(output, 'Available Commands');
  assert.match(output, 'localize');
});

test('help with localize command', async ({console, stdin}) => {
  const cli = new LitCli(['help', 'localize'], {console, stdin});
  await cli.run();

  const output = console.outputStream.text;

  assert.equal(console.errorStream.buffer.length, 0);
  assert.match(output, 'lit localize');
  assert.match(output, 'Sub-Commands');
  assert.match(output, 'extract');
  assert.match(output, 'build');
});

test('help with localize extract command', async ({console, stdin}) => {
  const cli = new LitCli(['help', 'localize', 'extract'], {
    console,
    stdin,
  });
  await cli.run();

  const output = console.outputStream.text;

  assert.equal(console.errorStream.buffer.length, 0);
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
    cwd: fs.temp,
    stdin,
  });
  cli.addCommand(fooCommandReference);
  await cli.run();
  const output = console.outputStream.text;
  assert.equal(console.errorStream.buffer.length, 0);
  assert.match(
    output,
    /\s+foo\s+This is the description in the `foo` reference./
  );
});

test('help includes unresolved external command descriptions', async ({
  console,
  fs,
  stdin,
}) => {
  const cli = new LitCli(['help'], {
    console,
    cwd: fs.temp,
    stdin,
  });
  cli.addCommand(fooCommandReference);
  await cli.run();
  const output = console.outputStream.text;
  assert.equal(console.errorStream.buffer.length, 0);
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
    cwd: fs.temp,
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
    cwd: fs.temp,
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
    cwd: fs.temp,
    stdin,
  });
  cli.addCommand(fooCommandReference);
  await cli.run();
  output = console.outputStream.text;
  assert.equal(console.errorStream.buffer.length, 0);
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
    cwd: pathlib.join(fs.temp, 'working-dir'),
  });
  cli.addCommand({...fooCommandReference, installFrom: '../foo-package'});
  await cli.run();
  assert.equal(console.errorStream.text, '');
  // The npm install happend.
  assert.match(console.outputStream.text, 'added 1 package');
  // After installation, we were able to resolve the command.
  assert.match(
    console.outputStream.text,
    'this is the resolved foo command from the node_modules directory'
  );
});

testBase.run();
