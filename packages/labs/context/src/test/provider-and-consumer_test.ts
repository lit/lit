/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, TemplateResult} from 'lit';
import {property} from 'lit/decorators/property.js';

import {Context, consume, provide} from '@lit-labs/context';
import {assert} from '@esm-bundle/chai';

const simpleContext = 'simple-context' as Context<'simple-context', number>;

class ContextConsumerAndProviderElement extends LitElement {
  @consume({context: simpleContext, subscribe: true})
  @property({type: Number})
  public provided = 0;

  @provide({context: simpleContext})
  @property({type: Number})
  public value = 0;

  protected render(): TemplateResult {
    return html`Value <span id="value">${this.value}</span
      ><span id="fromAbove">${this.provided}</span><slot></slot>`;
  }
}
customElements.define(
  'context-consumer-and-provider',
  ContextConsumerAndProviderElement
);

suite('@providerAndConsumer', () => {
  let root: ContextConsumerAndProviderElement;
  let parent: ContextConsumerAndProviderElement;
  let child: ContextConsumerAndProviderElement;
  let container: HTMLElement;
  setup(async () => {
    container = document.createElement('div');
    container.innerHTML = `
      <context-consumer-and-provider id="root" value="10" provided="20">
        <context-consumer-and-provider id="parent" value="100" provided="200">
          <context-consumer-and-provider id="child"></context-consumer-and-provider>
        </context-consumer-and-provider>
      </context-consumer-and-provider>
    `;
    document.body.appendChild(container);

    root = container.querySelector(
      '#root'
    ) as ContextConsumerAndProviderElement;

    parent = container.querySelector(
      '#parent'
    ) as ContextConsumerAndProviderElement;

    child = container.querySelector(
      '#child'
    ) as ContextConsumerAndProviderElement;

    await root.updateComplete;
    await parent.updateComplete;
    await child.updateComplete;

    assert.isDefined(child);
  });

  teardown(() => {
    document.body.removeChild(container);
  });

  test(`parent receives a context from root`, async () => {
    assert.strictEqual(parent.provided, 10);
  });
  test(`child receives a context from parent`, async () => {
    assert.strictEqual(child.provided, 100);
  });

  test(`parent receives updated context on root change`, async () => {
    assert.strictEqual(parent.provided, 10);
    root.value = 50;
    await parent.updateComplete;
    assert.strictEqual(parent.provided, 50);
  });

  test(`child does not receives updated context on root change`, async () => {
    assert.strictEqual(child.provided, 100);
    root.value = 51;
    await child.updateComplete;
    assert.strictEqual(child.provided, 100);
  });

  test(`child receives updated context on parent change`, async () => {
    assert.strictEqual(child.provided, 100);
    parent.value = 500;
    await child.updateComplete;
    assert.strictEqual(child.provided, 500);
  });
});
