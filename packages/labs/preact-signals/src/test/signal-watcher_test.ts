/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {assert} from 'chai';

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

  test('type-only test where mixin on an abstract class preserves abstract type', () => {
    if (true as boolean) {
      // This is a type-only test. Do not run it.
      return;
    }
    abstract class BaseEl extends LitElement {
      abstract foo(): void;
    }
    // @ts-expect-error foo() needs to be implemented.
    class TestEl extends SignalWatcher(BaseEl) {}
    console.log(TestEl); // usage to satisfy eslint.

    const TestElFromAbstractSignalWatcher = SignalWatcher(BaseEl);
    // @ts-expect-error cannot instantiate an abstract class.
    new TestElFromAbstractSignalWatcher();

    // This is fine, passed in class is not abstract.
    const TestElFromConcreteClass = SignalWatcher(LitElement);
    new TestElFromConcreteClass();
  });

  test('class returned from signal-watcher should be directly instantiatable if non-abstract', async () => {
    const count = signal(0);
    class TestEl extends LitElement {
      override render() {
        return html`<p>count: ${count.value}</p>`;
      }
    }
    const TestElWithSignalWatcher = SignalWatcher(TestEl);
    customElements.define(generateElementName(), TestElWithSignalWatcher);
    const el = new TestElWithSignalWatcher();
    container.append(el);

    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 0');

    count.value = 1;

    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
  });

  test('subscribes to a signal on disconnected element update', async () => {
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

    // Force an update; resubscribes to signals
    el.requestUpdate();
    await el.updateComplete;

    // Expect reads if updated after disconnected
    count.value = 1;
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 2');
    assert.equal(readCount, 2);
  });

  ((window as any).gc ? test : test.skip)(
    'unsubscribes to a signal when element is not reachable',
    async () => {
      let tries = 0;
      const forceGc = async () => {
        tries++;
        if (tries > 3) {
          return false;
        }
        const largeArray = [];
        for (let i = 0; i < 1e6; i++) {
          largeArray.push(new Array(1e3).fill(i));
        }
        await new Promise((r) => setTimeout(r));
        for (let i = 0; i < 10; i++) {
          (window as any).gc();
        }
        return true;
      };

      const count = signal(0);
      const countPlusOne = computed(() => {
        return count.value + 1;
      });

      class TestElement extends SignalWatcher(LitElement) {
        override render() {
          return html`<p>count: ${countPlusOne.value}</p>`;
        }
      }
      customElements.define(generateElementName(), TestElement);
      let el: TestElement | undefined = new TestElement();
      container.append(el);
      await el.updateComplete;
      el.remove();

      // Force element to update to resubscribe to signal
      el.requestUpdate();
      await el.updateComplete;

      // Track if element is reachable
      const ref = new WeakRef(el);
      el = undefined;
      assert.ok(ref.deref());

      // Attempt to force garbage collection
      while (ref.deref() && (await forceGc())) {
        count.value++;
      }

      // Test if element is reachable
      assert.isUndefined(ref.deref());
    }
  );
});
