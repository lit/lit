/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {property} from 'lit/decorators.js';
import {cache} from 'lit/directives/cache.js';
import {assert} from '@esm-bundle/chai';

import {watch, signal, computed, SignalWatcher} from '../index.js';

let elementNameId = 0;
const generateElementName = () => `test-${elementNameId++}`;

suite('watch directive', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    container?.remove();
  });

  test('watches a signal', async () => {
    let renderCount = 0;
    const count = signal(0);
    class TestElement extends LitElement {
      override render() {
        renderCount++;
        return html`<p>count: ${watch(count)}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);

    // The first DOM update is because of an element render
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 0');
    assert.equal(renderCount, 1);

    // The DOM updates because signal update
    count.value = 1;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
    // The updated DOM is not because of an element render
    assert.equal(renderCount, 1);
  });

  test('unsubscribes to a signal on element disconnect', async () => {
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
    // Elements do *not* automatically render when re-connected
    assert.isFalse(el.isUpdatePending);

    // So when reconnected, we read the signal value again
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 2');
    assert.equal(readCount, 2);

    // And signal updates propagate again
    count.value = 2;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 3');
    assert.equal(readCount, 3);
  });

  test('unsubscribes to a signal on directive disconnect', async () => {
    let readCount = 0;
    const count = signal(0);
    const countPlusOne = computed(() => {
      readCount++;
      return count.value + 1;
    });

    class TestElement extends LitElement {
      @property() renderWithSignal = true;

      signalTemplate = html`${watch(countPlusOne)}`;

      stringTemplate = html`string`;

      override render() {
        const t = this.renderWithSignal
          ? this.signalTemplate
          : this.stringTemplate;
        // Cache the expression so that we preserve the directive instance
        // and trigger the reconnected code-path.
        // TODO (justinfagnani): it would be nice if we could assert that we
        // really did trigger reconnected instead of rendering a new directive,
        // but we don't want to code the directive to specifically leave a trace
        // of reconnected-ness.
        return html`<p>value: ${cache(t)}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);

    // First render with the signal, expect one read of the signal
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'value: 1');
    assert.equal(readCount, 1);

    // Render with a non-signal
    el.renderWithSignal = false;
    await el.updateComplete;

    // Expect no reads while disconnected
    count.value = 1;
    assert.equal(
      el.shadowRoot?.querySelector('p')?.textContent,
      'value: string'
    );
    assert.equal(readCount, 1);

    // Render with the signal again
    el.renderWithSignal = true;
    await el.updateComplete;

    // Render should use the new value
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'value: 2');
    assert.equal(readCount, 2);

    // And signal updates propagate again
    count.value = 2;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'value: 3');
    assert.equal(readCount, 3);
  });

  test('does not trigger an element update', async () => {
    let renderCount = 0;
    const count = signal(0);
    class TestElement extends SignalWatcher(LitElement) {
      override render() {
        renderCount++;
        return html`<p>count: ${watch(count)}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);

    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 0');
    assert.equal(renderCount, 1);

    count.value = 1;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
    // The updated DOM is not because of an element render
    assert.equal(renderCount, 1, 'A');
    // The signal update does not trigger a render
    assert.equal(el.isUpdatePending, false);
  });
});
