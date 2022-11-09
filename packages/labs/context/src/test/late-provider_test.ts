/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, TemplateResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import {
  Context,
  consume,
  provide,
  ContextRoot,
  ContextProvider,
} from '@lit-labs/context';
import {assert} from '@esm-bundle/chai';

const simpleContext = 'simple-context' as Context<'simple-context', number>;

@customElement('context-consumer')
class ContextConsumerElement extends LitElement {
  @consume({context: simpleContext, subscribe: true})
  @property({type: Number})
  public value = 0;

  @consume({context: simpleContext})
  @property({type: Number})
  public onceValue = 0;

  protected render(): TemplateResult {
    return html`Value <span id="value">${this.value}</span>`;
  }
}

class LateContextProviderElement extends LitElement {
  @provide({context: simpleContext})
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

@customElement('lazy-context-provider')
export class LazyContextProviderElement extends LitElement {
  protected render() {
    return html`<slot></slot>`;
  }
}

suite('late context provider', () => {
  // let consumer: ContextConsumerElement;
  // let provider: LateContextProviderElement;
  let container: HTMLElement;

  setup(async () => {
    container = document.createElement('div');
    document.body.append(container);

    // Add a root context to catch late providers and re-dispatch requests
    new ContextRoot().attach(container);
  });

  teardown(() => {
    container.remove();
  });

  test(`handles late upgrade properly`, async () => {
    container.innerHTML = `
        <late-context-provider value="1000">
            <context-consumer></context-consumer>
        </late-context-provider>
    `;

    const provider = container.querySelector(
      'late-context-provider'
    ) as LateContextProviderElement;

    const consumer = container.querySelector(
      'context-consumer'
    ) as ContextConsumerElement;

    await consumer.updateComplete;

    // Initially consumer has initial value
    assert.strictEqual(consumer.value, 0);
    assert.strictEqual(consumer.onceValue, 0);

    // Define provider element
    customElements.define('late-context-provider', LateContextProviderElement);

    await provider.updateComplete;
    await consumer.updateComplete;

    // `value` should now be provided
    assert.strictEqual(consumer.value, 1000);

    // but only to the subscribed value
    assert.strictEqual(consumer.onceValue, 0);

    // Confirm subscription is established
    provider.value = 500;
    await consumer.updateComplete;
    assert.strictEqual(consumer.value, 500);

    // and once was not updated
    assert.strictEqual(consumer.onceValue, 0);
  });

  test('lazy added provider', async () => {
    container.innerHTML = `
        <lazy-context-provider>
            <context-consumer></context-consumer>
        </lazy-context-provider>
    `;

    const provider = container.querySelector(
      'lazy-context-provider'
    ) as LazyContextProviderElement;

    const consumer = container.querySelector(
      'context-consumer'
    ) as ContextConsumerElement;

    await consumer.updateComplete;

    // Add a provider after the elements are setup
    new ContextProvider(provider, simpleContext, 1000);

    await provider.updateComplete;
    await consumer.updateComplete;

    // `value` should now be provided
    assert.strictEqual(consumer.value, 1000);
  });
});
