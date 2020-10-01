/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const fs = require('fs');
const path = require('path');

const version = require(path.join(__dirname, 'package.json')).version;
const ts = fs.readFileSync(path.join(__dirname, 'src', 'lit-element.ts'));
if (!ts.includes(version)) {
  console.log(
      `\nExpected lit-element.ts to contain current version "${version}"`);
  console.log(
      `Don't forget to update the version tracker string before release!`);
  process.exit(1);
}
