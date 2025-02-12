/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ssrNonHydratedFixture,
  ssrHydratedFixture,
  cleanupFixtures,
} from '../fixtures.js';

import {html} from 'lit';
import {assert} from '@open-wc/testing';

import './good-element.js';

teardown(() => {
  cleanupFixtures();
});

for (const fixture of [ssrNonHydratedFixture, ssrHydratedFixture]) {
  suite(`init-script rendered with ${fixture.name}`, () => {
    test('renders good-element', async () => {
      const el = await fixture(html`<good-element></good-element>`, {
        base: import.meta.url,
        modules: ['../src/test/good-element.ts'],
      });
      assert.shadowDom.equal(
        el,
        `
          <h1>Hello, World!</h1>
          <button part="button">Click Count: 0</button>
          <slot></slot>
        `
      );
    });
  });
}
