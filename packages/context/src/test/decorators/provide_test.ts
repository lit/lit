/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Context, consume, provide} from '@lit/context';
import {assert} from 'chai';
import {LitElement, TemplateResult, html} from 'lit';
import {property} from 'lit/decorators.js';

const simpleContext = 'simple-context' as Context<'simple-context', number>;

class SimpleConsumer extends LitElement {
  @consume({context: simpleContext, subscribe: true})
  value = -1;

  override render(): TemplateResult {
    return html``;
  }
}
customElements.define('simple-consumer', SimpleConsumer);

test(`@provide on a property, not an accessor`, async () => {
  class ProviderWithoutAccessorElement extends LitElement {
    // Note that value doesn't use `accessor`, or `@property()`, or `@state`
    @provide({context: simpleContext})
    value = 0;

    override render(): TemplateResult {
      return html`<simple-consumer></simple-consumer>`;
    }
  }
  customElements.define(
    'provider-without-accessor',
    ProviderWithoutAccessorElement
  );

  const provider = document.createElement(
    'provider-without-accessor'
  ) as ProviderWithoutAccessorElement;
  document.body.appendChild(provider);
  // The field's value is written with its initial value.
  assert.equal(provider.value, 0);
  await provider.updateComplete;
  const consumer = provider.shadowRoot?.querySelector(
    'simple-consumer'
  ) as SimpleConsumer;
  // The consumer's value is written with the provider's initial value.
  assert.equal(provider.value, 0);
  assert.equal(consumer.value, 0);

  // Updating the provider also updates the subscribing consumer.
  provider.value = 1;
  await provider.updateComplete;
  assert.equal(provider.value, 1);
  assert.equal(consumer.value, 1);
});

test('@provide before @property', async () => {
  class ProvideBeforeProperty extends LitElement {
    @provide({context: simpleContext})
    @property({type: Number})
    value = 0;

    render() {
      return html`
        <span>${this.value}</span>
        <simple-consumer></simple-consumer>
      `;
    }
  }
  customElements.define('provide-before-property', ProvideBeforeProperty);

  const provider = document.createElement(
    'provide-before-property'
  ) as ProvideBeforeProperty;
  document.body.appendChild(provider);
  // The field's value is written with its initial value.
  assert.equal(provider.value, 0);
  await provider.updateComplete;
  const consumer = provider.shadowRoot?.querySelector(
    'simple-consumer'
  ) as SimpleConsumer;
  // The consumer's value is written with the provider's initial value.
  assert.equal(provider.value, 0);
  assert.equal(consumer.value, 0);

  provider.value = 1;
  await provider.updateComplete;
  // Confirm provider is reactive.
  assert.equal(provider.shadowRoot?.querySelector('span')?.textContent, '1');
  // Updating the provider also updates the subscribing consumer.
  assert.equal(consumer.value, 1);
});

test('@provide after @property', async () => {
  class ProvideAfterProperty extends LitElement {
    @property({type: Number})
    @provide({context: simpleContext})
    value = 0;

    render() {
      return html`
        <span>${this.value}</span>
        <simple-consumer></simple-consumer>
      `;
    }
  }
  customElements.define('provide-after-property', ProvideAfterProperty);

  const provider = document.createElement(
    'provide-after-property'
  ) as ProvideAfterProperty;
  document.body.appendChild(provider);
  // The field's value is written with its initial value.
  assert.equal(provider.value, 0);
  await provider.updateComplete;
  const consumer = provider.shadowRoot?.querySelector(
    'simple-consumer'
  ) as SimpleConsumer;
  // The consumer's value is written with the provider's initial value.
  assert.equal(provider.value, 0);
  assert.equal(consumer.value, 0);

  provider.value = 1;
  await provider.updateComplete;
  // Confirm provider is reactive.
  assert.equal(provider.shadowRoot?.querySelector('span')?.textContent, '1');
  // Updating the provider also updates the subscribing consumer.
  assert.equal(consumer.value, 1);
});
