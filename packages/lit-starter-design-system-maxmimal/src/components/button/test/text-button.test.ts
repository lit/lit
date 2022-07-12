/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {TextButton} from '../text-button.js';

import {fixture, assert} from '@open-wc/testing';
import {html} from 'lit/static-html.js';

suite('my-text-button', () => {
  test('is defined', () => {
    const el = document.createElement('my-text-button');
    assert.instanceOf(el, TextButton);
  });

  test('renders with default values', async () => {
    const el = await fixture(html`<my-text-button></my-text-button>`);
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
      html`<my-text-button name="Test"></my-text-button>`
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

  test('handles a click', async () => {
    const el = (await fixture(
      html`<my-text-button></my-text-button>`
    )) as TextButton;
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
  });

  test('styling applied', async () => {
    const el = (await fixture(
      html`<my-text-button></my-text-button>`
    )) as TextButton;
    await el.updateComplete;
    assert.equal(getComputedStyle(el).paddingTop, '16px');
  });
});
