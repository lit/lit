/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as fs from 'fs';
import * as process from 'process';

/**
 * Takes the `publishedPackages` output of the `changesets/action` GitHub action
 * on standard input and writes the version of `lit` that was published to
 * standard output. If `lit` was not published, it writes the empty string.
 *
 * https://github.com/changesets/action#outputs
 */

const publishedPackages = JSON.parse(
  fs.readFileSync(process.stdin.fd, 'utf-8')
);
const litVersion = publishedPackages.find((x) => x.name === 'lit')?.version;
console.log(litVersion ?? '');
