/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  csrFixture,
  ssrNonHydratedFixture,
  ssrHydratedFixture,
  cleanupFixtures,
} from '../fixtures.js';

import {html} from 'lit';
import {assert} from '@open-wc/testing';
import {GoodElement} from './good-element.js';

teardown(() => {
  cleanupFixtures();
});

for (const fixture of [csrFixture, ssrNonHydratedFixture, ssrHydratedFixture]) {
  suite(`good-element rendered with ${fixture.name}`, () => {
    (fixture === ssrNonHydratedFixture ? test.skip : test)('is defined', () => {
      const el = document.createElement('good-element');
      assert.instanceOf(el, GoodElement);
    });

    test('renders with default values', async () => {
      const el = await fixture(html`<good-element></good-element>`, {
        base: import.meta.url,
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
          base: import.meta.url,
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
      const el = await fixture<GoodElement>(
        html`<good-element></good-element>`,
        {
          base: import.meta.url,
          modules: ['./good-element.js'],
        }
      );
      assert.equal(getComputedStyle(el).paddingTop, '16px');
    });

    (fixture === ssrNonHydratedFixture ? test.skip : test)(
      `handles a click`,
      async () => {
        const el = await fixture<GoodElement>(
          html`<good-element></good-element>`,
          {
            base: import.meta.url,
            modules: ['./good-element.js'],
          }
        );
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

  suite(`nested good-element rendered with ${fixture.name}`, () => {
    test('renders with default values', async () => {
      const el = await fixture(html`<div><good-element></good-element></div>`, {
        base: import.meta.url,
        modules: ['./good-element.js'],
      });
      const goodEl = el.querySelector('good-element');
      assert.ok(goodEl);
      assert.shadowDom.equal(
        goodEl,
        `
          <h1>Hello, World!</h1>
          <button part="button">Click Count: 0</button>
          <slot></slot>
        `
      );
    });

    test('renders with a set name', async () => {
      const el = await fixture(
        html`<div><good-element name="Test"></good-element></div>`,
        {
          base: import.meta.url,
          modules: ['./good-element.js'],
        }
      );
      assert.shadowDom.equal(
        el.querySelector('good-element'),
        `
          <h1>Hello, Test!</h1>
          <button part="button">Click Count: 0</button>
          <slot></slot>
        `
      );
    });

    test('styling applied', async () => {
      const el = await fixture(html`<div><good-element></good-element></div>`, {
        base: import.meta.url,
        modules: ['./good-element.js'],
      });
      assert.equal(
        getComputedStyle(el.querySelector('good-element')!).paddingTop,
        '16px'
      );
    });

    (fixture === ssrNonHydratedFixture ? test.skip : test)(
      `handles a click`,
      async () => {
        const el = await fixture(
          html`<div><good-element></good-element></div>`,
          {
            base: import.meta.url,
            modules: ['./good-element.js'],
          }
        );
        const goodEl = el.querySelector('good-element')!;
        const button = goodEl.shadowRoot!.querySelector('button')!;
        button.click();
        await goodEl.updateComplete;
        assert.shadowDom.equal(
          goodEl,
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
