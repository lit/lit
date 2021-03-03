/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as fs from 'fs';
import * as path from 'path';

const packageFile = fs.readFileSync(path.resolve('package.json'));
const {version} = JSON.parse(packageFile);
const ts = fs.readFileSync(path.resolve('src/lit-element.ts'));

if (!ts.includes(`'${version}'`)) {
  console.log(
    `\nExpected lit-element.ts to contain current version "${version}"`
  );
  console.log(
    `Don't forget to update the version tracker string before release!`
  );
  process.exit(1);
}
