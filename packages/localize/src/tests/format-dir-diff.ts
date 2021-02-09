/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';
import * as fsExtra from 'fs-extra';
import * as dirCompare from 'dir-compare';
import * as diff from 'diff';

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
      golden = fsExtra.readFileSync(path.join(diff.path1, diff.name1), 'utf8');
    }
    if (diff.path2 && diff.name2) {
      actual = fsExtra.readFileSync(path.join(diff.path2, diff.name2), 'utf8');
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
