/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {createApp} from 'vue';
import ElementSub from '@lit-internal/test-element-a-vue/sub/ElementSub.js';
import {ElementSub as ElementSubElement} from '@lit-internal/test-element-a/sub/element-sub.js';
import SubContainer from './SubContainer.vue';

suite('test-element-a', () => {
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
    createApp(ElementSub, {foo}).mount(container);
    const el = container.querySelector('element-sub')! as ElementSubElement;
    await el.updateComplete;
    const {firstElementChild} = el.shadowRoot!;
    assert.equal(firstElementChild?.localName, 'h1');
    assert.equal(firstElementChild?.textContent, foo);
  });

  test('renders inside a Vue component', async () => {
    const foo = 'ContainerFoo';
    createApp(SubContainer, {foo}).mount(container);
    const containerHeader = container.querySelector(
      'header'
    )! as HTMLHeadingElement;
    assert.equal(containerHeader.textContent, 'Container');
    const ce = container.querySelector('element-sub')! as ElementSubElement;
    await ce.updateComplete;
    const {firstElementChild} = ce.shadowRoot!;
    assert.equal(firstElementChild?.localName, 'h1');
    assert.equal(firstElementChild?.textContent, foo);
  });
});
