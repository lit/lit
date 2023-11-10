/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextProvider, Context} from '@lit/context';
import {assert} from '@esm-bundle/chai';
import {stripExpressionComments} from '@lit-labs/testing';

import {simpleContext, SimpleContextConsumer} from './context-request_test.js';

suite('htmlelement-context-provider', () => {
  let provider: ContextProvider<Context<unknown, number>, HTMLElement>;
  let consumer: SimpleContextConsumer;

  setup(async () => {
    const container = document.createElement('div');
    container.innerHTML = `
       <simple-context-consumer></simple-context-consumer>
     `;

    provider = new ContextProvider(container, {
      context: simpleContext,
      initialValue: 1000,
    });

    document.body.appendChild(container);
    provider.hostConnected();

    consumer = container.querySelector(
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
