/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {assert} from '@esm-bundle/chai';

import {SignalWatcher, signal} from '../index.js';

let elementNameId = 0;
const generateElementName = () => `test-${elementNameId++}`;

suite('SignalWatcher', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    container?.remove();
  });

  test('watches a signal', async () => {
    const count = signal(0);
    class TestElement extends SignalWatcher(LitElement) {
      override render() {
        return html`<p>count: ${count.value}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);

    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 0');

    count.value = 1;

    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
  });
});
