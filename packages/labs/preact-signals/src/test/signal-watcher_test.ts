/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {assert} from '@esm-bundle/chai';

import {SignalWatcher, computed, signal} from '../index.js';

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

  test('unsubscribes to a signal on element disconnect', async () => {
    let readCount = 0;
    const count = signal(0);
    const countPlusOne = computed(() => {
      readCount++;
      return count.value + 1;
    });

    class TestElement extends SignalWatcher(LitElement) {
      override render() {
        return html`<p>count: ${countPlusOne.value}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);

    // First render, expect one read of the signal
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
    assert.equal(readCount, 1);

    // Disconnect the element
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

    // Reconnect the element
    container.append(el);
    assert.isTrue(el.isConnected);
    // The mixin causes the element to update on re-connect
    assert.isTrue(el.isUpdatePending);

    // So when reconnected, we still have the old value
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
    assert.equal(readCount, 1);

    // And signal updates propagate again - and we get the new value
    count.value = 2;
    assert.isTrue(el.isUpdatePending);
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 3');
    assert.equal(readCount, 2);
  });
});
