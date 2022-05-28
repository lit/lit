/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {
  csrFixture,
  ssrNonHydratedFixture,
  ssrHydratedFixture,
} from '../fixtures.js';

import {html} from 'lit';
import {assert} from '@open-wc/testing';
import {GoodElement} from './good-element.js';

for (const fixture of [csrFixture, ssrNonHydratedFixture, ssrHydratedFixture]) {
  suite(`good-element rendered with ${fixture.name}`, () => {
    (fixture === ssrNonHydratedFixture ? test.skip : test)('is defined', () => {
      const el = document.createElement('good-element');
      assert.instanceOf(el, GoodElement);
    });

    test('renders with default values', async () => {
      const el = await fixture(html`<good-element></good-element>`, {
        modules: ['./good-element.js'],
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

    test('renders with a set name', async () => {
      const el = await fixture(
        html`<good-element name="Test"></good-element>`,
        {
          modules: ['./good-element.js'],
        }
      );
      assert.shadowDom.equal(
        el,
        `
          <h1>Hello, Test!</h1>
          <button part="button">Click Count: 0</button>
          <slot></slot>
        `
      );
    });

    test('styling applied', async () => {
      const el = (await fixture(html`<good-element></good-element>`, {
        modules: ['./good-element.js'],
      })) as GoodElement;
      assert.equal(getComputedStyle(el).paddingTop, '16px');
    });

    (fixture === ssrNonHydratedFixture ? test.skip : test)(
      `handles a click`,
      async () => {
        const el = (await fixture(html`<good-element></good-element>`, {
          modules: ['./good-element.js'],
        })) as GoodElement;
        const button = el.shadowRoot!.querySelector('button')!;
        button.click();
        await el.updateComplete;
        assert.shadowDom.equal(
          el,
          `
            <h1>Hello, World!</h1>
            <button part="button">Click Count: 1</button>
            <slot></slot>
          `
        );
      }
    );
  });
}
