/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as path from 'path';
import {execFileSync} from 'child_process';
import test from 'ava';
import {runAndLog} from '../cli';
import * as fsExtra from 'fs-extra';
import * as dirCompare from 'dir-compare';
import {formatDirDiff} from './format-dir-diff';

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
 * @param {name} Name of a sub-directory in "<repo root>/testdata/". Must
 * contain input/ and goldens/ sub-directories.
 * @param {args} Command line arguments to lit-localize (not including the node
 * binary and script name). Note that we chdir to the output/ directory before
 * running the command, so relative paths in arguments can be used here.
 * @param {expectedExitCode} The expected process exit code.
 */
export function e2eGoldensTest(
  name: string,
  args: string[],
  expectedExitCode = 0
) {
  const root = path.resolve(__dirname, '..', '..', 'testdata', name);
  const inputDir = path.join(root, 'input');
  const outputDir = path.join(root, 'output');
  const goldensDir = path.join(root, 'goldens');

  test(`e2e: ${name}`, async (t) => {
    fsExtra.emptyDirSync(outputDir);
    fsExtra.copySync(inputDir, outputDir);

    const oldCwd = process.cwd();
    process.chdir(outputDir);
    t.teardown(() => {
      process.chdir(oldCwd);
    });

    const exitCode = await runAndLog(['node', 'lit-localize', ...args]);
    t.is(exitCode, expectedExitCode);

    // Format emitted TypeScript to make test output more readable.
    execFileSync('npx', [
      '--no-install',
      'prettier',
      '--write',
      `${outputDir}/**/*.ts`,
    ]);

    if (process.env.UPDATE_TEST_GOLDENS) {
      fsExtra.emptyDirSync(goldensDir);
      fsExtra.copySync(outputDir, goldensDir);
      t.fail('Failing on purpose because goldens were updated.');
      return;
    }

    const diff = await dirCompare.compare(goldensDir, outputDir, {
      compareContent: true,
    });
    if (diff.same) {
      t.pass();
    } else {
      t.fail(formatDirDiff(diff));
    }
  });
}
