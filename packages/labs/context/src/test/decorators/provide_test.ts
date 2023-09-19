/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Context, consume, provide} from '@lit-labs/context';
import {assert} from '@esm-bundle/chai';
import {LitElement, TemplateResult, html} from 'lit';

const simpleContext = 'simple-context' as Context<'simple-context', number>;

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
  class SimpleConsumer extends LitElement {
    @consume({context: simpleContext, subscribe: true})
    value = -1;

    override render(): TemplateResult {
      return html``;
    }
  }
  customElements.define('simple-consumer', SimpleConsumer);

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
