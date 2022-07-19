/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, TemplateResult} from 'lit';
import {property} from 'lit/decorators/property.js';

import {
  ContextKey,
  contextProvided,
  contextProvider,
  ContextRoot,
} from '@lit-labs/context';
import {assert} from '@esm-bundle/chai';

const simpleContext = 'simple-context' as ContextKey<'simple-context', number>;

class ContextConsumerElement extends LitElement {
  @contextProvided({context: simpleContext, subscribe: true})
  @property({type: Number})
  public value = 0;

  @contextProvided({context: simpleContext})
  @property({type: Number})
  public onceValue = 0;

  protected render(): TemplateResult {
    return html`Value <span id="value">${this.value}</span>`;
  }
}
customElements.define('context-consumer', ContextConsumerElement);

class LateContextProviderElement extends LitElement {
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

suite('late context provider', () => {
  let consumer: ContextConsumerElement;
  let provider: LateContextProviderElement;
  let container: HTMLElement;
  setup(async () => {
    container = document.createElement('div');

    // add a root context to catch late providers and re-dispatch requests
    new ContextRoot().attach(container);

    container.innerHTML = `
         <late-context-provider value="1000">
             <context-consumer></context-consumer>
         </late-context-provider>
     `;
    document.body.appendChild(container);

    provider = container.querySelector(
      'late-context-provider'
    ) as LateContextProviderElement;

    consumer = container.querySelector(
      'context-consumer'
    ) as ContextConsumerElement;

    await consumer.updateComplete;

    assert.isDefined(consumer);
  });

  teardown(() => {
    document.body.removeChild(container);
  });

  test(`handles late upgrade properly`, async () => {
    // initially consumer has initial value
    assert.strictEqual(consumer.value, 0);
    assert.strictEqual(consumer.onceValue, 0);
    // do upgrade
    customElements.define('late-context-provider', LateContextProviderElement);
    // await update of provider component
    await provider.updateComplete;
    // await update of consumer component
    await consumer.updateComplete;
    // should now have provided context
    assert.strictEqual(consumer.value, 1000);
    // but only to the subscribed value
    assert.strictEqual(consumer.onceValue, 0);
    // confirm subscription is established
    provider.value = 500;
    await consumer.updateComplete;
    assert.strictEqual(consumer.value, 500);
    // and once was not updated
    assert.strictEqual(consumer.onceValue, 0);
  });
});
