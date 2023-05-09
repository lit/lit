/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';

const test = suite('eslint-plugin-lit tests');

test('Hello', () => {
  assert.equal(1 + 1, 2);
});

test.run();
