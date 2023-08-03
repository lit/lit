/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import type {LitElement} from 'lit';

import {createWorkerElement} from '../lib/worker-element.js';

suite('workers', () => {
  let container: HTMLElement;

  setup(async () => {
    container = document.createElement('div');
    document.body.append(container);
  });

  teardown(async () => {
    // container.remove();
  });

  test(`test`, async () => {
    console.log('A');
    const localElementClass = createWorkerElement({
      tagName: 'test-element',
      url: new URL('./test-element.js', import.meta.url).href,
      attributes: ['name'],
    });
    customElements.define('local-test-element', localElementClass);
    container.innerHTML =
      '<local-test-element name="Main Thread"></local-test-element>';
    const localElement = container.querySelector(
      'local-test-element'
    ) as LitElement;
    await localElement.updateComplete;
    await new Promise((res) => setTimeout(res, 100));
    assert.include(localElement.shadowRoot?.innerHTML, '<h1>');
  });
});
