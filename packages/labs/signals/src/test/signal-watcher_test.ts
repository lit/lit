/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {assert} from '@esm-bundle/chai';

import {SignalWatcher, Signal, effect} from '../index.js';
import {customElement, property} from 'lit/decorators.js';

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
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
    assert.equal(readCount, 1);

    // Updates work
    count.set(1);
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 2');
    assert.equal(readCount, 2);

    // Disconnect the element
    el.remove();
    await el.updateComplete;

    // Expect no reads while disconnected
    count.set(2);
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 2');
    assert.equal(readCount, 2);

    // Even after an update
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 2');
    assert.equal(readCount, 2);

    // Reconnect the element
    container.append(el);
    assert.isTrue(el.isConnected);
    // The mixin causes the element to update on re-connect
    assert.isTrue(el.isUpdatePending);

    // So when reconnected, we still have the old value
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 2');
    assert.equal(readCount, 2);

    // But after an update, we get the new value
    await el.updateComplete;
    assert.equal(countPlusOne.get(), 3);
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 3');
    assert.equal(readCount, 3);

    // When signals change again we get the new value
    count.set(3);
    assert.isTrue(el.isUpdatePending);
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 4');
    assert.equal(readCount, 4);
  });

  test('unsubscribes to a signal on element disconnect with pending update', async () => {
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
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
    assert.equal(readCount, 1);

    // Updates work
    count.set(1);
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 2');
    assert.equal(readCount, 2);

    // Update signal and disconnect the element
    count.set(2);
    el.remove();

    // Expect update to complete
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 3');
    assert.equal(readCount, 3);

    // Expect no reads while disconnected
    count.set(3);
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 3');
    assert.equal(readCount, 3);

    // Even after an update
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 3');
    assert.equal(readCount, 3);

    // Reconnect the element
    container.append(el);
    assert.isTrue(el.isConnected);
    // The mixin causes the element to update on re-connect
    assert.isTrue(el.isUpdatePending);

    // So when reconnected, we still have the old value
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 3');
    assert.equal(readCount, 3);

    // But after an update, we get the new value
    await el.updateComplete;
    assert.equal(countPlusOne.get(), 4);
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 4');
    assert.equal(readCount, 4);

    // When signals change again we get the new value
    count.set(4);
    assert.isTrue(el.isUpdatePending);
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 5');
    assert.equal(readCount, 5);
  });

  // TODO: no longer abstract, so this test is no longer relevant. Remove?
  test.skip('type-only test where mixin on an abstract class preserves abstract type', () => {
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
    // @ts-expect-error foo() needs to be implemented.
    const TestElFromAbstractSignalWatcher = SignalWatcher(BaseEl);
    new TestElFromAbstractSignalWatcher();

    // This is fine, passed in class is not abstract.
    const TestElFromConcreteClass = SignalWatcher(LitElement);
    new TestElFromConcreteClass();
  });

  // TODO: no longer abstract, so this test is no longer relevant. Remove?
  test.skip('class returned from signal-watcher should be directly instantiatable if non-abstract', async () => {
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

  // const isChrome = navigator.userAgent.match(/Chrome/);
  // (isChrome ? test : test.skip)(
  test.skip('watcher does not hold onto element after disconnect', async () => {
    const count = new Signal.State(0);
    @customElement(generateElementName())
    class TestElement extends SignalWatcher(LitElement) {
      largeProperty = Array.from({length: 10_000}, (_, k) => k);

      override render() {
        return html`<p>count: ${count.get()}</p>`;
      }
    }
    const elementCount = 10_000;

    // Make, add, and remove a bunch of elements
    const elementRefs: Array<WeakRef<TestElement>> = [];
    for (let i = 0; i < elementCount; i++) {
      const el = new TestElement();
      elementRefs.push(new WeakRef(el));
      container.append(el);
      await el.updateComplete;
      assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 0');
      el.remove();
    }
    assert.equal(container.children.length, 0);

    // Force a GC cycle to clean up the elements. Await event loop turns,
    // because.
    for (let i = 0; i < 10; i++) {
      gc();
      await new Promise((r) => setTimeout(r, 1));
    }

    // Check that some elements are garbage collected
    const survivingElements = elementRefs.filter(
      (ref) => ref.deref() !== undefined
    );
    assert.isTrue(survivingElements.length < elementCount);
  });

  test('effect notifies signal updates (after update by default)', async () => {
    const count = new Signal.State(0);
    const other = new Signal.State(0);
    let effectCount = 0;
    let effectOther = 0;
    let effectCalled = 0;
    class TestElement extends SignalWatcher(LitElement) {
      constructor() {
        super();
        effect(
          () => {
            effectCount = count.get();
            effectOther = other.get();
            effectCalled++;
          },
          {element: this}
        );
      }
      override render() {
        return html`<p>count: ${count.get()}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);
    await el.updateComplete;
    // Called initially
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 0');
    assert.equal(effectCount, 0);
    assert.equal(effectOther, 0);
    assert.equal(effectCalled, 1);

    // Called when signal updates that's used in render
    count.set(1);
    await el.updateComplete;
    assert.equal(el.shadowRoot?.querySelector('p')?.textContent, 'count: 1');
    assert.equal(effectCount, 1);
    assert.equal(effectOther, 0);
    assert.equal(effectCalled, 2);

    // Called when any accessed signal updates
    other.set(1);
    await el.updateComplete;
    assert.equal(effectCount, 1);
    assert.equal(effectOther, 1);
    assert.equal(effectCalled, 3);

    // Called when render signal and other signal updates
    count.set(2);
    other.set(2);
    await el.updateComplete;
    assert.equal(effectCount, 2);
    assert.equal(effectOther, 2);
    assert.equal(effectCalled, 4);

    // *Not* called when element updates
    el.requestUpdate();
    await el.updateComplete;
    assert.equal(effectCount, 2);
    assert.equal(effectOther, 2);
    assert.equal(effectCalled, 4);
  });

  test('effect notifies signal updates beforeUpdate', async () => {
    const count = new Signal.State(0);
    const other = new Signal.State(0);
    let effectCount = 0;
    let effectOther = 0;
    let effectTextContent = '';
    let effectCalled = 0;
    class TestElement extends SignalWatcher(LitElement) {
      constructor() {
        super();
        effect(
          () => {
            effectTextContent = this.hasUpdated
              ? el.shadowRoot!.querySelector('p')!.textContent!
              : '';
            effectCount = count.get();
            effectOther = other.get();
            effectCalled++;
          },
          {element: this, beforeUpdate: true}
        );
      }
      override render() {
        return html`<p>count: ${count.get()}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);
    await el.updateComplete;
    // Called initially
    assert.equal(effectTextContent, '');
    assert.equal(effectCount, 0);
    assert.equal(effectOther, 0);
    assert.equal(effectCalled, 1);

    // Called when signal updates that's used in render
    count.set(1);
    await el.updateComplete;
    assert.equal(effectTextContent, 'count: 0');
    assert.equal(effectCount, 1);
    assert.equal(effectOther, 0);
    assert.equal(effectCalled, 2);

    // Called when any accessed signal updates
    other.set(1);
    await el.updateComplete;
    assert.equal(effectTextContent, 'count: 1');
    assert.equal(effectCount, 1);
    assert.equal(effectOther, 1);
    assert.equal(effectCalled, 3);

    // Called when render signal and other signal updates
    count.set(2);
    other.set(2);
    await el.updateComplete;
    assert.equal(effectTextContent, 'count: 1');
    assert.equal(effectCount, 2);
    assert.equal(effectOther, 2);
    assert.equal(effectCalled, 4);

    // *Not* called when element updates
    el.requestUpdate();
    assert.equal(effectTextContent, 'count: 1');
    await el.updateComplete;
    assert.equal(effectCount, 2);
    assert.equal(effectOther, 2);
    assert.equal(effectCalled, 4);
  });

  test('effects disposed when disconnected', async () => {
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
    let effectCount = 0;
    effect(
      () => {
        effectCount = count.get();
      },
      {element: el}
    );
    await el.updateComplete;
    assert.equal(effectCount, 0);
    el.remove();
    await el.updateComplete;
    count.set(1);
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(effectCount, 0);
  });

  test('can manually dispose of effects', async () => {
    const count = new Signal.State(0);
    const other = new Signal.State(0);
    class TestElement extends SignalWatcher(LitElement) {
      override render() {
        return html`<p>count: ${count.get()}</p>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.append(el);
    await el.updateComplete;
    let effectOther = undefined;
    const disposeEffect = effect(
      () => {
        effectOther = other.get();
      },
      {element: el}
    );
    await el.updateComplete;
    assert.equal(effectOther, 0);
    other.set(1);
    await el.updateComplete;
    assert.equal(effectOther, 1);
    disposeEffect();
    other.set(2);
    await el.updateComplete;
    assert.equal(effectOther, 1);
  });

  test('standalone effects', async () => {
    const count = new Signal.State(0);
    const frame = () => new Promise(requestAnimationFrame);
    let effectCount;
    const dispose = effect(() => {
      effectCount = count.get();
    });
    await frame();
    // Called initially
    assert.equal(effectCount, 0);
    count.set(1);
    await frame();
    assert.equal(effectCount, 1);
    dispose();
    count.set(2);
    await frame();
    assert.equal(effectCount, 1);
  });
});

declare global {
  function gc(): void;
}
