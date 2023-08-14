/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ssrFixture, cleanupFixtures} from '../fixtures.js';

import {html} from 'lit';
import {assert} from '@open-wc/testing';

teardown(() => {
  cleanupFixtures();
});

suite(`bad-elements`, () => {
  test('fails with document.querySelectorAll', async () => {
    let err: Error | null = null;
    try {
      await ssrFixture(html`<bad-element-a></bad-element-a>`, {
        base: import.meta.url,
        modules: ['./bad-element-a.js'],
      });
    } catch (error) {
      err = error as Error;
    }
    assert.match(err?.message ?? '', /document is not defined/);
  });
});
