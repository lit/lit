/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {assert} from '@esm-bundle/chai';

import {SignalWatcher, Signal} from '../index.js';
import {property} from 'lit/decorators.js';

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
    const count = new Signal.State(0);
    class TestElement extends SignalWatcher(LitElement) {
      override render() {
        return html`<p>count: ${count.get()}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);

    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 0');

    count.set(1);
    // await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
  });

  test('non-signal updates work', async () => {
    const count = new Signal.State(0);
    let renderCount = 0;
    class TestElement extends SignalWatcher(LitElement) {
      @property()
      foo = 'foo';

      override render() {
        renderCount++;
        return html`
          <p>count: ${count.get()}</p>
          <p>foo: ${this.foo}</p>
        `;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);

    await el.updateComplete;
    const p1 = el.shadowRoot!.querySelectorAll('p')[0]!;
    const p2 = el.shadowRoot!.querySelectorAll('p')[1]!;

    assert.equal(p1.textContent, 'count: 0');
    assert.equal(p2.textContent, 'foo: foo');
    assert.equal(renderCount, 1);

    count.set(1);
    await el.updateComplete;
    assert.equal(p1.textContent, 'count: 1');
    assert.equal(p2.textContent, 'foo: foo');
    assert.equal(renderCount, 2);

    el.foo = 'bar';
    await el.updateComplete;
    assert.equal(p1.textContent, 'count: 1');
    assert.equal(p2.textContent, 'foo: bar');
    assert.equal(renderCount, 3);

    count.set(2);
    el.foo = 'baz';
    await el.updateComplete;
    assert.equal(p1.textContent, 'count: 2');
    assert.equal(p2.textContent, 'foo: baz');
    assert.equal(renderCount, 4);
  });

  test('unsubscribes to a signal on element disconnect', async () => {
    let readCount = 0;
    const count = new Signal.State(0);
    const countPlusOne = new Signal.Computed(() => {
      readCount++;
      return count.get() + 1;
    });

    class TestElement extends SignalWatcher(LitElement) {
      override render() {
        return html`<p>count: ${countPlusOne.get()}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);

    // First render, expect one read of the signal
    await el.updateComplete;
    assert.equal(
      el.shadowRoot?.querySelector('p')?.textContent,
      'count: 1',
      'A'
    );
    assert.equal(readCount, 1);

    // Updates work
    count.set(1);
    await el.updateComplete;
    assert.equal(
      el.shadowRoot?.querySelector('p')?.textContent,
      'count: 2',
      'B'
    );
    assert.equal(readCount, 2);

    // Disconnect the element
    el.remove();
    await el.updateComplete;

    // Expect no reads while disconnected
    count.set(2);
    assert.equal(
      el.shadowRoot?.querySelector('p')?.textContent,
      'count: 2',
      'C'
    );
    assert.equal(readCount, 2);

    // Even after an update
    await el.updateComplete;
    assert.equal(
      el.shadowRoot?.querySelector('p')?.textContent,
      'count: 2',
      'D'
    );
    assert.equal(readCount, 2);

    // Reconnect the element
    container.append(el);
    assert.isTrue(el.isConnected);
    // The mixin causes the element to update on re-connect
    assert.isTrue(el.isUpdatePending);

    // So when reconnected, we still have the old value
    assert.equal(
      el.shadowRoot?.querySelector('p')?.textContent,
      'count: 2',
      'E'
    );
    assert.equal(readCount, 2);

    // But after an update, we get the new value
    await el.updateComplete;
    assert.equal(countPlusOne.get(), 3, 'How is this failing? 2');
    assert.equal(
      el.shadowRoot?.querySelector('p')?.textContent,
      'count: 3',
      'F'
    );
    assert.equal(readCount, 3);

    // When signals change again we get the new value
    count.set(3);
    assert.isTrue(el.isUpdatePending);
    await el.updateComplete;
    assert.equal(
      el.shadowRoot?.querySelector('p')?.textContent,
      'count: 4',
      'G'
    );
    assert.equal(readCount, 4);
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
    const count = new Signal.State(0);
    class TestEl extends LitElement {
      override render() {
        return html`<p>count: ${count.get()}</p>`;
      }
    }
    const TestElWithSignalWatcher = SignalWatcher(TestEl);
    customElements.define(generateElementName(), TestElWithSignalWatcher);
    const el = new TestElWithSignalWatcher();
    container.append(el);

    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 0');

    count.set(count.get() + 1);

    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
  });
});
