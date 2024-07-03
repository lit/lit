/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {isServer} from 'lit-html/is-server.js';
import {assert} from 'chai';

suite('is-server', () => {
  test('isServer is false', () => {
    assert.strictEqual(isServer, false);
  });
});
