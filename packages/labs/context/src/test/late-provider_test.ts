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
  ContextConsumer,
  createContext,
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

const ua = window.navigator.userAgent;
const isIE = ua.indexOf('Trident/') > 0;

const suiteSkipIE: typeof suite.skip = (...args) =>
  isIE ? suite.skip(...args) : suite(...args);

suiteSkipIE('late context provider', () => {
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

  test(`handles late upgrade properly in nested shadowRoot`, async () => {
    const host = document.createElement('div');

    host.attachShadow({mode: 'open'});
    const root = host.shadowRoot!;
    root.innerHTML = `
        <late-context-provider-nested value="1000">
            <context-consumer></context-consumer>
        </late-context-provider-nested>
    `;

    container.append(host);

    const provider = root.querySelector(
      'late-context-provider-nested'
    ) as LateContextProviderElement;

    const consumer = root.querySelector(
      'context-consumer'
    ) as ContextConsumerElement;

    await consumer.updateComplete;

    // Initially consumer has initial value
    assert.strictEqual(consumer.value, 0);
    assert.strictEqual(consumer.onceValue, 0);

    // Define provider element
    customElements.define(
      'late-context-provider-nested',
      class extends LateContextProviderElement {}
    );

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
    @customElement('lazy-context-provider')
    class LazyContextProviderElement extends LitElement {
      protected render() {
        return html`<slot></slot>`;
      }
    }
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
    new ContextProvider(provider, {context: simpleContext, initialValue: 1000});

    await provider.updateComplete;
    await consumer.updateComplete;

    // `value` should now be provided
    assert.strictEqual(consumer.value, 1000);
  });

  test('late element with multiple properties', async () => {
    @customElement('context-consumer-2')
    class ContextConsumer2Element extends LitElement {
      @consume({context: simpleContext, subscribe: true})
      @property({type: Number})
      public value1 = 0;

      @consume({context: simpleContext, subscribe: true})
      @property({type: Number})
      public value2 = 0;
    }

    container.innerHTML = `
      <late-context-provider-2 value="999">
        <context-consumer-2></context-consumer-2>
      </late-context-provider-2>
    `;

    const provider = container.querySelector(
      'late-context-provider-2'
    ) as LateContextProviderElement;

    const consumer = container.querySelector(
      'context-consumer-2'
    ) as ContextConsumer2Element;

    // Let consumer update once with no provider
    await consumer.updateComplete;

    // Define provider element
    customElements.define(
      'late-context-provider-2',
      class extends LateContextProviderElement {}
    );

    await provider.updateComplete;
    await consumer.updateComplete;

    // Check that regardless of de-duping in ContextRoot, both @consume()
    // decorated properties were set.
    assert.equal(consumer.value1, 999, 'value1');
    assert.equal(consumer.value2, 999, 'value2');
  });

  test('a moved component is only provided to once', async () => {
    @customElement('context-consumer-3')
    class ContextConsumer3Element extends LitElement {
      _consume = new ContextConsumer(
        this,
        simpleContext,
        (value) => {
          this.value = value;
          this.callCount++;
        },
        true
      );

      value: number | undefined = undefined;

      callCount = 0;
    }

    container.innerHTML = `
      <late-context-provider-3 value="999">
        <div id="parent-1">
          <context-consumer-3></context-consumer-3>
        </div>
        <div id="parent-2"></div>
      </late-context-provider-3>
    `;

    const provider = container.querySelector(
      'late-context-provider-3'
    ) as LateContextProviderElement;

    const consumer = container.querySelector(
      'context-consumer-3'
    ) as ContextConsumer3Element;

    const parent2 = container.querySelector('#parent-2')!;

    // Let consumer update once with no provider
    await consumer.updateComplete;

    // Re-parent the consumer so it dispatches a new context-request event
    parent2.append(consumer);

    // Let consumer update again with no provider
    await consumer.updateComplete;

    // Define provider element
    customElements.define(
      'late-context-provider-3',
      class extends LateContextProviderElement {}
    );

    await provider.updateComplete;
    await consumer.updateComplete;

    assert.equal(consumer.value, 999);
    // Check that the consumer was called only once
    assert.equal(consumer.callCount, 1);
  });

  test('a provider that upgrades after an ancestor provider', async () => {
    const context = createContext<string>(Symbol());
    @customElement('context-consumer-4')
    class ContextConsumer4Element extends LitElement {
      consume = new ContextConsumer(this, {
        context,
        subscribe: true,
        callback: (value) => {
          this.value = value;
          this.callCount++;
        },
      });

      value = 'consumer initializer';

      callCount = 0;
    }
    @customElement('context-provider-grandparent')
    class ContextProviderGrandparentElement extends LitElement {
      provide = new ContextProvider(this, {
        context,
        initialValue: 'grandparent initial value',
      });
    }

    container.innerHTML = `
      <context-provider-grandparent>
        <context-consumer-4></context-consumer-4>
        <late-context-provider-4>
          <context-consumer-4></context-consumer-4>
        </late-context-provider-4>
      </context-provider-grandparent>
    `;
    const directChildConsumer = container.querySelector(
      'context-provider-grandparent > context-consumer-4'
    ) as ContextConsumer4Element;
    const indirectChildConsumer = container.querySelector(
      'late-context-provider-4 > context-consumer-4'
    ) as ContextConsumer4Element;
    const grandparentProvider = container.querySelector(
      'context-provider-grandparent'
    ) as ContextProviderGrandparentElement;

    await directChildConsumer.updateComplete;
    assert.equal(directChildConsumer.value, 'grandparent initial value');
    assert.equal(directChildConsumer.callCount, 1);
    assert.equal(indirectChildConsumer.value, 'grandparent initial value');
    assert.equal(indirectChildConsumer.callCount, 1);
    grandparentProvider.provide.setValue('grandparent updated');
    await directChildConsumer.updateComplete;
    assert.equal(directChildConsumer.value, 'grandparent updated');
    assert.equal(directChildConsumer.callCount, 2);
    assert.equal(indirectChildConsumer.value, 'grandparent updated');
    assert.equal(indirectChildConsumer.callCount, 2);

    @customElement('late-context-provider-4')
    class LateContextProvider4Element extends LitElement {
      provide = new ContextProvider(this, {
        context,
        initialValue: 'late provider initial value',
      });
    }
    await directChildConsumer.updateComplete;
    // bad!
    assert.equal(directChildConsumer.value, 'grandparent updated');
    assert.equal(indirectChildConsumer.value, 'late provider initial value');

    const middleProvider = container.querySelector(
      'late-context-provider-4'
    ) as LateContextProvider4Element;
    middleProvider.provide.setValue('late provider updated');
    await directChildConsumer.updateComplete;
    // bad!
    assert.equal(directChildConsumer.value, 'grandparent updated');
    assert.equal(indirectChildConsumer.value, 'late provider updated');
  });
});
