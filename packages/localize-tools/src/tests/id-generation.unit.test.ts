/** @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'node:test';
import * as assert from 'node:assert';
import {generateMsgId} from '@lit/localize/internal/id-generation.js';

test('plain string message', () => {
  // msg('Hello World') -> s + fnv1a64("Hello World")
  const got = generateMsgId(['Hello World'], false);
  assert.strictEqual(got, 's3d58dee72d4e0c27');
});

test('HTML tagged message', () => {
  // msg(html`<b>Hello World</b>`) -> h + fnv1a64("<b>Hello World</b>")
  const got = generateMsgId(['<b>Hello World</b>'], true);
  assert.strictEqual(got, 'hc468c061c2d171f4');
});

test('parameterized string message', () => {
  // msg(str`Hello ${name}`) -> s + fnv1a64("Hello " + \x1e + "")
  const got = generateMsgId(['Hello ', ''], false);
  assert.strictEqual(got, 'saed7d3734ce7f09d');
});
