/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, LitElement} from 'lit';
import {property} from 'lit/decorators/property.js';

import {
  ContextConsumer,
  ContextProvider,
  createContext,
  contextProvided,
} from '@lit-labs/context';
import {assert} from '@esm-bundle/chai';

const simpleContext = createContext<number>('simple-context');

// @TODO: would be good to get this exported out of lit-elements
const stripExpressionComments = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!--\??-->/g, '');

class SimpleContextProvider extends LitElement {
  private provider = new ContextProvider(this, simpleContext, 1000);

  public setValue(value: number) {
    this.provider.setValue(value);
  }
}

class SimpleContextConsumer extends LitElement {
  // a one-time property fullfilled by context
  @contextProvided({context: simpleContext})
  @property({type: Number})
  public onceValue = 0;

  // a subscribed property fulfilled by context
  @contextProvided({context: simpleContext, subscribe: true})
  @property({type: Number})
  public subscribedValue = 0;

  // just use the controller directly
  public controllerContext = new ContextConsumer(
    this,
    simpleContext,
    undefined, // no callback
    true // subscribe to updates
  );

  public render() {
    return html`${this.controllerContext.value}`;
  }
}

customElements.define('simple-context-consumer', SimpleContextConsumer);
customElements.define('simple-context-provider', SimpleContextProvider);

suite('context-provider', () => {
  let provider: SimpleContextProvider;
  let consumer: SimpleContextConsumer;

  setup(async () => {
    const container = document.createElement('div');
    container.innerHTML = `
       <simple-context-provider>
         <simple-context-consumer></simple-context-consumer>
       </simple-context-provider>
     `;
    document.body.appendChild(container);

    provider = container.querySelector(
      'simple-context-provider'
    ) as SimpleContextProvider;
    assert.isDefined(provider);
    consumer = provider.querySelector(
      'simple-context-consumer'
    ) as SimpleContextConsumer;
    assert.isDefined(consumer);
  });

  test(`consumer receives a context`, async () => {
    assert.strictEqual(consumer.onceValue, 1000);
    assert.strictEqual(consumer.subscribedValue, 1000);
    assert.strictEqual(consumer.controllerContext.value, 1000);
    await consumer.updateComplete;
    assert.equal(
      stripExpressionComments(consumer.shadowRoot!.innerHTML),
      '1000'
    );
  });

  test(`consumer receives updated context on provider change`, async () => {
    assert.strictEqual(consumer.onceValue, 1000);
    assert.strictEqual(consumer.subscribedValue, 1000);
    assert.strictEqual(consumer.controllerContext.value, 1000);
    await consumer.updateComplete;
    assert.equal(
      stripExpressionComments(consumer.shadowRoot!.innerHTML),
      '1000'
    );
    provider.setValue(500);
    assert.strictEqual(consumer.onceValue, 1000); // once value shouldn't change
    assert.strictEqual(consumer.subscribedValue, 500);
    assert.strictEqual(consumer.controllerContext.value, 500);
    await consumer.updateComplete;
    assert.equal(
      stripExpressionComments(consumer.shadowRoot!.innerHTML),
      '500'
    );
  });
});
