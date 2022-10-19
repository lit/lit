/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {createApp} from 'vue';
import ElementEvents from '@lit-internal/test-element-events-vue/ElementEvents.js';
import {ElementEvents as ElementEventsElement} from '@lit-internal/test-element-events/element-events.js';

suite('test-element-events', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('renders correctly', async () => {
    const foo = 'Hello World';
    createApp(ElementEvents, {foo}).mount(container);
    const el = container.querySelector(
      'element-events'
    )! as ElementEventsElement;
    await el.updateComplete;
    const {firstElementChild} = el.shadowRoot!;
    assert.equal(firstElementChild?.localName, 'h1');
    assert.equal(firstElementChild?.textContent, foo);
  });
});
