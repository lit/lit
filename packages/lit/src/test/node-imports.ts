/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This file will be loaded by Node from the node:test script to verify that all
// exports of this package can be imported without crashing in Node.

import 'lit';
import 'lit/decorators.js';
import 'lit/decorators/custom-element.js';
import 'lit/decorators/event-options.js';
import 'lit/decorators/property.js';
import 'lit/decorators/query.js';
import 'lit/decorators/query-all.js';
import 'lit/decorators/query-assigned-elements.js';
import 'lit/decorators/query-assigned-nodes.js';
import 'lit/decorators/query-async.js';
import 'lit/decorators/state.js';
import 'lit/directive-helpers.js';
import 'lit/directive.js';
import 'lit/directives/async-append.js';
import 'lit/directives/async-replace.js';
import 'lit/directives/cache.js';
import 'lit/directives/choose.js';
import 'lit/directives/class-map.js';
import 'lit/directives/guard.js';
import 'lit/directives/if-defined.js';
import 'lit/directives/join.js';
import 'lit/directives/keyed.js';
import 'lit/directives/live.js';
import 'lit/directives/map.js';
import 'lit/directives/range.js';
import 'lit/directives/ref.js';
import 'lit/directives/repeat.js';
import 'lit/directives/style-map.js';
import 'lit/directives/template-content.js';
import 'lit/directives/unsafe-html.js';
import 'lit/directives/unsafe-svg.js';
import 'lit/directives/until.js';
import 'lit/directives/when.js';
import 'lit/async-directive.js';
import 'lit/html.js';
import 'lit/static-html.js';

import assert from 'node:assert/strict';
import {isServer} from 'lit';
assert.strictEqual(isServer, true, 'Expected isServer to be true');
