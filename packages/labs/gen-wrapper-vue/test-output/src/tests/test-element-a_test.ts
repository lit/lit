/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {createApp} from 'vue';
import ElementA from '@lit-internal/test-element-a-vue/ElementA.js';
import {ElementA as ElementAElement} from '@lit-internal/test-element-a/element-a.js';
import Container from './Container.vue';

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
    createApp(ElementA, {foo}).mount(container);
    const el = container.querySelector('element-a')! as ElementAElement;
    await el.updateComplete;
    const {firstElementChild} = el.shadowRoot!;
    assert.equal(firstElementChild?.localName, 'h1');
    assert.equal(firstElementChild?.textContent, foo);
  });

  test('renders inside a Vue component', async () => {
    const foo = 'ContainerFoo';
    createApp(Container, {foo}).mount(container);
    const containerHeader = container.querySelector(
      'header'
    )! as HTMLHeadingElement;
    assert.equal(containerHeader.textContent, 'Container');
    const ce = container.querySelector('element-a')! as ElementAElement;
    await ce.updateComplete;
    const {firstElementChild} = ce.shadowRoot!;
    assert.equal(firstElementChild?.localName, 'h1');
    assert.equal(firstElementChild?.textContent, foo);
  });
});
