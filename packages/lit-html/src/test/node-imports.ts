/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This file will be loaded by Node from the node:test script to verify that all
// exports of this package can be imported without crashing in Node.

import 'lit-html';
import 'lit-html/directives/async-append.js';
import 'lit-html/directives/async-replace.js';
import 'lit-html/directives/cache.js';
import 'lit-html/directives/choose.js';
import 'lit-html/directives/class-map.js';
import 'lit-html/directives/guard.js';
import 'lit-html/directives/if-defined.js';
import 'lit-html/directives/join.js';
import 'lit-html/directives/keyed.js';
import 'lit-html/directives/live.js';
import 'lit-html/directives/map.js';
import 'lit-html/directives/range.js';
import 'lit-html/directives/ref.js';
import 'lit-html/directives/repeat.js';
import 'lit-html/directives/style-map.js';
import 'lit-html/directives/template-content.js';
import 'lit-html/directives/unsafe-html.js';
import 'lit-html/directives/unsafe-svg.js';
import 'lit-html/directives/until.js';
import 'lit-html/directives/when.js';
import 'lit-html/directive.js';
import 'lit-html/directive-helpers.js';
import 'lit-html/async-directive.js';
import 'lit-html/static.js';
import 'lit-html/private-ssr-support.js';
import 'lit-html/polyfill-support.js';

import assert from 'node:assert/strict';
import {isServer} from 'lit-html/is-server.js';
assert.strictEqual(isServer, true, 'Expected isServer to be true');
