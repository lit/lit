/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, TemplateResult} from 'lit';
import {property} from 'lit/decorators/property.js';

import {ContextKey} from '../index.js';
import {contextProvided} from '../lib/decorators/context-provided.js';
import {contextProvider} from '../lib/decorators/context-provider.js';
import {assert} from '@esm-bundle/chai';

const simpleContext = 'simple-context' as ContextKey<'simple-context', number>;

class ContextConsumerElement extends LitElement {
  @contextProvided({context: simpleContext, subscribe: true})
  @property({type: Number})
  public value = 0;

  protected render(): TemplateResult {
    return html`Value <span id="value">${this.value}</span>`;
  }
}
customElements.define('context-consumer', ContextConsumerElement);

class ContextProviderElement extends LitElement {
  @contextProvider({context: simpleContext})
  @property({type: Number, reflect: true})
  public value = 0;

  protected render(): TemplateResult {
    return html`
      <div>
        <slot></slot>
      </div>
    `;
  }
}
customElements.define('context-provider', ContextProviderElement);

suite('@contextProvided', () => {
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
});

suite('@contextProvided: multiple instances', () => {
  let consumers: ContextConsumerElement[];
  let providers: ContextProviderElement[];
  let container: HTMLElement;
  const count = 3;
  setup(async () => {
    container = document.createElement('div');
    container.innerHTML = new Array(count)
      .fill(0)
      .map(
        (_v, i) => `
        <context-provider value="${1000 + i}">
            <context-consumer></context-consumer>
        </context-provider>`
      )
      .join('/n');
    document.body.appendChild(container);

    providers = Array.from(
      container.querySelectorAll('context-provider')
    ) as ContextProviderElement[];

    consumers = Array.from(
      container.querySelectorAll('context-consumer')
    ) as ContextConsumerElement[];

    await Promise.all([...providers, ...consumers].map((el) => el.updateComplete));
    await Promise.all(consumers.map((el) => el.updateComplete));

    consumers.forEach((c) => assert.isDefined(c));
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
