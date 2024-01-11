/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';
import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {runAndLog} from '../../cli.js';
import fsExtra from 'fs-extra';
import {dirname} from 'path';
import {fileURLToPath} from 'url';

import {assertGoldensMatch} from '@lit-internal/tests/utils/assert-goldens.js';

/**
 * Run lit-localize end-to-end using input and golden files from the filesystem.
 *
 * Data files will be read from the "<repo root>/testdata/<name>/" directory,
 * which should contain the following sub-directories
 *
 *     input/ -- The initial state of some test project working directory.
 *   goldens/ -- The state of input/ after lit-localize has executed.
 *
 * A sub-directory called output/ will be created during the test containing a
 * recursive copy of input/, which is then processed by lit-localize. All files
 * in the output/ and goldens/ directories are compared, and the test will fail
 * if any are missing, extra, or have different content.
 *
 * If the UPDATE_TEST_GOLDENS environment variable is set and not-empty, we'll
 * update the goldens/ directory to match output/, and fail the test to prevent
 * accidentally having this setting on.
 *
 * @param name Name of a sub-directory in "<repo root>/testdata/". Must
 *     contain input/ and goldens/ sub-directories.
 * @param args Command line arguments to lit-localize (not including the node
 *     binary and script name). Note that we chdir to the output/ directory
 *     before running the command, so relative paths in arguments can be used
 *     here.
 * @param expectedExitCode The expected process exit code.
 */
export function e2eGoldensTest(
  name: string,
  args: string[],
  expectedExitCode = 0,
  expectedStdOutErr = ''
) {
  const root = path.resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'testdata',
    name
  );
  const inputDir = path.join(root, 'input');
  const outputDir = path.join(root, 'output');
  const goldensDir = path.join(root, 'goldens');

  const testSuite = suite(`e2e: ${name}`);
  let oldCwd: string;

  testSuite.before(async () => {
    fsExtra.emptyDirSync(outputDir);
    fsExtra.copySync(inputDir, outputDir);
    oldCwd = process.cwd();
    process.chdir(outputDir);
  });

  testSuite.after(async () => {
    process.chdir(oldCwd);
  });

  testSuite(`e2e: ${name}`, async () => {
    const realStdoutWrite = process.stdout.write;
    const realStderrWrite = process.stderr.write;
    let stdOutErr = '';
    process.stdout.write = (buffer: string) => {
      stdOutErr += buffer;
      return true;
    };
    process.stderr.write = (buffer: string) => {
      stdOutErr += buffer;
      return true;
    };

    let exitCode;
    try {
      exitCode = await runAndLog(['node', 'lit-localize', ...args]);
    } finally {
      process.stdout.write = realStdoutWrite;
      process.stderr.write = realStderrWrite;
    }

    if (expectedExitCode === 0 && exitCode !== 0) {
      console.log(stdOutErr);
    }

    assert.is(exitCode, expectedExitCode);
    assert.ok(
      stdOutErr.includes(expectedStdOutErr),
      `stdout/stderr did not include expected value, got: ${stdOutErr}`
    );

    await assertGoldensMatch(outputDir, goldensDir);
  });

  testSuite.run();
}
