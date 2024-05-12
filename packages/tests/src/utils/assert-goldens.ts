/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import fsExtra from 'fs-extra';
import * as dirCompare from 'dir-compare';
import * as path from 'path';
import * as diff from 'diff';
import {execSync} from 'child_process';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const red = '\x1b[31m';
const green = '\x1b[32m';
const reset = '\x1b[0m';

/**
 * Given a dir-compare result, nicely format a colorized line-by-line diff of
 * the files that did not match.
 */
export function formatDirDiff(result: dirCompare.Result): string {
  const lines = [];
  for (const diff of result.diffSet || []) {
    if (diff.state === 'equal') {
      continue;
    }
    let golden = '';
    let actual = '';
    if (diff.path1 && diff.name1) {
      try {
        golden = fsExtra.readFileSync(
          path.join(diff.path1, diff.name1),
          'utf8'
        );
      } catch {
        // Keep empty string.
      }
    }
    if (diff.path2 && diff.name2) {
      try {
        actual = fsExtra.readFileSync(
          path.join(diff.path2, diff.name2),
          'utf8'
        );
      } catch {
        // Keep empty string.
      }
    }
    const relativePath = path.join(
      diff.relativePath,
      diff.name1 || diff.name2 || ''
    );
    const heading = `File differs: ${relativePath}`;
    const rule = new Array(heading.length + 1).join('=');
    lines.push('', rule, heading, rule, '');
    lines.push(colorLineDiff(golden, actual));
  }
  return lines.join('\n');
}

/**
 * Make a colorized line-by-line diff of two strings.
 */
function colorLineDiff(a: string, b: string): string {
  return diff
    .diffLines(a, b)
    .map(({added, removed, value}) => {
      if (added) {
        return `${green}+${value}${reset}`;
      } else if (removed) {
        return `${red}-${value}${reset}`;
      } else {
        return value;
      }
    })
    .join('');
}

export const assertGoldensMatch = async (
  outputDir: string,
  goldensDir: string,
  {formatGlob = '**/*.{ts,js}', noFormat = false} = {}
) => {
  if (!noFormat) {
    // We want to format the output even when it's ignored, so we use an empty
    // ignore file.
    const emptyIgnorePath = path.join(__dirname, '../../../.emptyignore');
    const args = [
      '--no-install',
      'prettier',
      '--ignore-path',
      emptyIgnorePath,
      '--write',
      `${path.join(outputDir, formatGlob)}`,
    ];
    execSync(`npx ${args.join(' ')}`);
  }

  if (process.env.UPDATE_TEST_GOLDENS) {
    fsExtra.emptyDirSync(goldensDir);
    fsExtra.copySync(outputDir, goldensDir);
    assert.unreachable('Failing on purpose because goldens were updated.');
    return;
  }

  const diff = await dirCompare.compare(goldensDir, outputDir, {
    compareContent: true,
    compareFileSync:
      dirCompare.fileCompareHandlers.lineBasedFileCompare.compareSync,
    compareFileAsync:
      dirCompare.fileCompareHandlers.lineBasedFileCompare.compareAsync,
    ignoreLineEnding: true,
  });

  if (!diff.same) {
    assert.unreachable(formatDirDiff(diff));
  }
};
