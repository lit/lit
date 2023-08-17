/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {assert} from '@esm-bundle/chai';

import {watch, signal, computed} from '../index.js';

let elementNameId = 0;
const generateElementName = () => `test-${elementNameId++}`;

suite('watch', () => {
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
    class TestElement extends LitElement {
      override render() {
        return html`<p>count: ${watch(count)}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);

    await el.updateComplete;
    console.log('A');
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 0');

    count.value = 1;
    await 0;
    console.log('B');
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
  });

  test('unsubscribes to a signal', async () => {
    let readCount = 0;
    const count = signal(0);
    const countPlusOne = computed(() => {
      readCount++;
      return count.value + 1;
    });

    class TestElement extends LitElement {
      override render() {
        return html`<p>count: ${watch(countPlusOne)}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);

    // First render, expect one read of the signal
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
    assert.equal(readCount, 1);

    // Force the directive to disconnect
    el.remove();
    await el.updateComplete;

    // Expect no reads while disconnected
    count.value = 1;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
    assert.equal(readCount, 1);

    // Even after an update
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
    assert.equal(readCount, 1);

    // Force the directive to reconnect
    container.append(el);

    // When reconnected, we read the signal value again
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 2');
    assert.equal(readCount, 2);

    // And signal updates propagate
    count.value = 2;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 3');
    assert.equal(readCount, 3);
  });
});
