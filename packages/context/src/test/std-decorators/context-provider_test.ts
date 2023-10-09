/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, TemplateResult} from 'lit';
import {property} from 'lit/decorators.js';

import {createContext, consume, provide} from '@lit/context';
import {assert} from '@esm-bundle/chai';

const simpleContext = createContext<number>('simple-context');
const optionalContext = createContext<number | undefined>('optional-context');

class ContextConsumerElement extends LitElement {
  @consume({context: simpleContext, subscribe: true})
  @property({type: Number})
  // TODO: should this include `| undefined`?
  public accessor value: number = undefined as unknown as number;

  // @ts-expect-error Type 'string' is not assignable to type 'number'.
  @consume({context: simpleContext, subscribe: true})
  @property({type: Number})
  public accessor value2: string | undefined;

  @consume({context: optionalContext, subscribe: true})
  @property({type: Number})
  public accessor optionalValue: number | undefined;

  @consume({context: optionalContext, subscribe: true})
  @property({type: Number})
  public accessor consumeOptionalWithDefault: number | undefined = 0;

  protected override render(): TemplateResult {
    return html`Value <span id="value">${this.value}</span>`;
  }
}
customElements.define('context-consumer', ContextConsumerElement);

class ContextProviderElement extends LitElement {
  @provide({context: simpleContext})
  @property({type: Number, reflect: true})
  public accessor value = 0;

  @provide({context: optionalContext})
  @property({type: Number})
  public accessor optionalValue: number | undefined;

  protected override render(): TemplateResult {
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
