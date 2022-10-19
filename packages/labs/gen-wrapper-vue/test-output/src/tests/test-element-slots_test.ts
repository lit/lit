/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {createApp} from 'vue';
import ElementSlots from '@lit-internal/test-element-slots-vue/ElementSlots.js';
import {ElementSlots as ElementSlotsElement} from '@lit-internal/test-element-slots/element-slots.js';

suite('test-element-slots', () => {
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
    createApp(ElementSlots).mount(container);
    const el = container.querySelector('element-slots')! as ElementSlotsElement;
    await el.updateComplete;
    const {firstElementChild} = el.shadowRoot!;
    assert.equal(firstElementChild?.localName, 'h1');
    assert.equal(firstElementChild?.textContent, 'Slots');
  });
});
