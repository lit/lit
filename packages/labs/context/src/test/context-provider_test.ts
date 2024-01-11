/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, TemplateResult} from 'lit';
import {property} from 'lit/decorators.js';

import {createContext, consume, provide} from '@lit-labs/context';
import {assert} from '@esm-bundle/chai';
import {memorySuite} from './test_util.js';

const simpleContext = createContext<number>('simple-context');
const optionalContext = createContext<number | undefined>('optional-context');

class ContextConsumerElement extends LitElement {
  @consume({context: simpleContext, subscribe: true})
  @property({type: Number})
  public value?: number;

  // @ts-expect-error Type 'string' is not assignable to type 'number'.
  @consume({context: simpleContext, subscribe: true})
  @property({type: Number})
  public value2?: string;

  @consume({context: optionalContext, subscribe: true})
  @property({type: Number})
  public optionalValue?: number;

  @consume({context: optionalContext, subscribe: true})
  @property({type: Number})
  public consumeOptionalWithDefault: number | undefined = 0;

  protected render(): TemplateResult {
    return html`Value <span id="value">${this.value}</span>`;
  }
}
customElements.define('context-consumer', ContextConsumerElement);

class ContextProviderElement extends LitElement {
  @provide({context: simpleContext})
  @property({type: Number, reflect: true})
  public value = 0;

  @provide({context: optionalContext})
  @property({type: Number})
  public optionalValue?: number;

  protected render(): TemplateResult {
    return html`
      <div>
        <slot></slot>
      </div>
    `;
  }
}
customElements.define('context-provider', ContextProviderElement);

suite('@consume', () => {
  let consumer: ContextConsumerElement;
  let provider: ContextProviderElement;
  let container: HTMLElement;
  setup(async () => {
    container = document.createElement('div');
    container.innerHTML = `
        <context-provider value="1000">
            <context-consumer></context-consumer>
        </context-provider>
    `;
    document.body.appendChild(container);

    provider = container.querySelector(
      'context-provider'
    ) as ContextProviderElement;

    consumer = container.querySelector(
      'context-consumer'
    ) as ContextConsumerElement;

    await provider.updateComplete;
    await consumer.updateComplete;

    assert.isDefined(consumer);
  });

  teardown(() => {
    document.body.removeChild(container);
  });

  test(`consumer receives a context`, async () => {
    assert.strictEqual(consumer.value, 1000);
  });

  test(`consumer receives updated context on provider change`, async () => {
    assert.strictEqual(consumer.value, 1000);
    provider.value = 500;
    await consumer.updateComplete;
    assert.strictEqual(consumer.value, 500);
  });

  test('consuming and providing with optional fields', async () => {
    assert.strictEqual(consumer.optionalValue, undefined);
    assert.strictEqual(consumer.consumeOptionalWithDefault, undefined);
    provider.optionalValue = 500;
    assert.strictEqual(consumer.optionalValue, 500);
    assert.strictEqual(consumer.consumeOptionalWithDefault, 500);
  });
});

suite('@consume: multiple instances', () => {
  let consumers: ContextConsumerElement[];
  let providers: ContextProviderElement[];
  let container: HTMLElement;
  const count = 3;
  setup(async () => {
    container = document.createElement('div');
    container.innerHTML = Array.from(
      {length: count},
      (_v, i) => `
        <context-provider value="${1000 + i}">
            <context-consumer></context-consumer>
        </context-provider>`
    ).join('/n');
    document.body.appendChild(container);

    providers = Array.from(
      container.querySelectorAll<ContextProviderElement>('context-provider')
    );

    consumers = Array.from(
      container.querySelectorAll<ContextConsumerElement>('context-consumer')
    );

    await Promise.all(
      [...providers, ...consumers].map((el) => el.updateComplete)
    );
  });

  teardown(() => {
    document.body.removeChild(container);
  });

  test(`consumers receive context`, async () => {
    consumers.forEach((consumer, i) =>
      assert.strictEqual(consumer.value, 1000 + i)
    );
  });

  test(`consumers receive updated context on provider change`, async () => {
    consumers.forEach((consumer, i) =>
      assert.strictEqual(consumer.value, 1000 + i)
    );
    providers.forEach((provider, i) => (provider.value = 500 + i));
    await Promise.all(consumers.map((el) => el.updateComplete));
    consumers.forEach((consumer, i) =>
      assert.strictEqual(consumer.value, 500 + i)
    );
  });
});

memorySuite('memory leak test', () => {
  let consumer: ContextConsumerElement;
  let provider: ContextProviderElement;
  let container: HTMLElement;

  // Make a big array set on an expando to exaggerate any leaked DOM
  const big = () => new Uint8Array(1024 * 10).fill(0);

  setup(async () => {
    container = document.createElement('div');
    container.innerHTML = `
        <context-provider value="1000">
            <context-consumer></context-consumer>
        </context-provider>
    `;
    document.body.appendChild(container);

    provider = container.querySelector(
      'context-provider'
    ) as ContextProviderElement;

    consumer = container.querySelector(
      'context-consumer'
    ) as ContextConsumerElement;

    await provider.updateComplete;
    await consumer.updateComplete;

    assert.isDefined(consumer);
  });

  teardown(() => {
    document.body.removeChild(container);
  });

  test('attaching and removing the consumer should not leak', async () => {
    window.gc();
    const heap = performance.memory.usedJSHeapSize;
    for (let i = 0; i < 1000; i++) {
      // Remove the previous consumer & add a new one.
      consumer.remove();
      consumer = document.createElement(
        'context-consumer'
      ) as ContextConsumerElement;
      (consumer as any).heapExpandoProp = big();
      provider.appendChild(consumer);
      await consumer.updateComplete;
      // Periodically force a GC to prevent the heap size from expanding
      // too much.
      // If we're leaking memory this is a noop. But if we aren't, this makes
      // it easier for the browser's GC to keep the heap size similar to the
      // actual amount of memory we're using.
      if (i % 30 === 0) {
        window.gc();
      }
    }
    window.gc();
    assert.isAtMost(
      performance.memory.usedJSHeapSize / heap - 1,
      // Allow a 10% margin of heap growth; due to the 10kb expando, an actual
      // DOM leak is orders of magnitude larger.
      0.1,
      'memory leak detected'
    );
  });
});

test('regression test for https://github.com/lit/lit/issues/4158', async () => {
  const context = createContext<string>('my-context');

  class Provider extends LitElement {
    @provide({context})
    name = 'b';

    @provide({context})
    n2 = 'a';

    render() {
      return html`<r-consumer></r-consumer><r-container></r-container>`;
    }
  }
  customElements.define('r-provider', Provider);

  class Consumer extends LitElement {
    @consume({context, subscribe: true})
    @property()
    n1 = 'c';

    render() {
      return html`<p>${this.n1}</p>`;
    }
  }
  customElements.define('r-consumer', Consumer);

  class Container extends LitElement {
    @provide({context})
    n2 = 'd';

    render() {
      return html`<r-consumer></r-consumer>`;
    }
  }
  customElements.define('r-container', Container);

  const provider = new Provider();
  document.body.appendChild(provider);
  // Ensure that the elements have enough time to update.
  await new Promise((r) => setTimeout(r, 0));
  // This test passes if it doesn't get into an infinite loop of attempted
  // repartenting of subscriptions.
  document.body.removeChild(provider);
});
