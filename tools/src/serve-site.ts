/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

import * as path from 'path';
import koa = require('koa');
import mount = require('koa-mount');
import serve = require('koa-static');

const app = new koa();
const docsDir = path.resolve(__dirname, '../../docs');
console.log('serving directory', docsDir);
app.use(mount('/lit-html/', serve(docsDir)));
const server = app.listen();
console.log(`lit-html docs server listening at ${server.address().port}`);
