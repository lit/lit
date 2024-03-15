/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, TemplateResult} from 'lit';
import {property} from 'lit/decorators/property.js';

import {
  ContextProvider,
  Context,
  ContextConsumer,
  MultiContextProvider,
} from '@lit-labs/context';
import {assert} from '@esm-bundle/chai';

const simpleContext = 'simple-context' as Context<'simple-context', number>;
const simpleStringContext = 'simple-string-context' as Context<
  'simple-string-context',
  string
>;

class SimpleContextProvider extends LitElement {
  private provider = new ContextProvider(this, {
    context: simpleContext,
    initialValue: 1000,
  });

  public setValue(value: number) {
    this.provider.setValue(value);
  }
}

class MultipleContextProvider extends LitElement {
  public provider = new MultiContextProvider(this, [
    {
      context: simpleContext,
      initialValue: 1000,
    },
    {
      context: simpleStringContext,
      initialValue: '2000',
    },
  ]);

  public setValueByContext(context: string, value: number | string) {
    this.provider.setValueByContext(context, value);
  }
}

class SimpleContextConsumer extends LitElement {
  @property({type: Number})
  public value = 0;

  public constructor() {
    super();
    new ContextConsumer(this, {
      context: simpleContext,
      callback: (value) => {
        this.value = value;
      },
      subscribe: true,
    });
  }

  protected render(): TemplateResult {
    return html`Value <span id="value">${this.value}</span>`;
  }
}

class MultipleContextConsumer extends LitElement {
  @property({type: Number})
  public numberValue = 0;
  public stringValue = '';

  public constructor() {
    super();
    new ContextConsumer(this, {
      context: simpleContext,
      callback: (value: number) => {
        this.numberValue = value;
      },
      subscribe: true,
    });
    new ContextConsumer(this, {
      context: simpleStringContext,
      callback: (value: string) => {
        this.stringValue = value;
      },
      subscribe: true,
    });
  }

  protected render(): TemplateResult {
    return html`Value
      <span id="value">${this.numberValue},${this.stringValue}</span>`;
  }
}
class OnceContextConsumer extends LitElement {
  @property({type: Number})
  public value = 0;

  public constructor() {
    super();
    new ContextConsumer(this, {
      context: simpleContext,
      callback: (value) => {
        this.value = value;
      },
    });
  }

  protected render(): TemplateResult {
    return html`Value <span id="value">${this.value}</span>`;
  }
}

customElements.define('simple-context-consumer', SimpleContextConsumer);
customElements.define('once-context-consumer', OnceContextConsumer);
customElements.define('simple-context-provider', SimpleContextProvider);
customElements.define('multiple-context-provider', MultipleContextProvider);
customElements.define('multiple-context-consumer', MultipleContextConsumer);

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
    assert.strictEqual(consumer.value, 1000);
  });

  test(`consumer receives updated context on provider change`, async () => {
    assert.strictEqual(consumer.value, 1000);
    provider.setValue(500);
    assert.strictEqual(consumer.value, 500);
  });

  test(`multiple consumers receive the same context`, async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <simple-context-consumer>
      </simple-context-consumer>
    `;
    provider.appendChild(container);
    const consumer2 = container.querySelector(
      'simple-context-consumer'
    ) as SimpleContextConsumer;
    assert.isDefined(consumer2);

    assert.strictEqual(consumer.value, 1000);
    assert.strictEqual(consumer2.value, 1000);

    provider.setValue(500);
    assert.strictEqual(consumer.value, 500);
    assert.strictEqual(consumer2.value, 500);
  });
  test(`one-time consumers only receive context once`, async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <once-context-consumer>
      </once-context-consumer>
    `;
    provider.appendChild(container);
    const consumer2 = container.querySelector(
      'once-context-consumer'
    ) as OnceContextConsumer;
    assert.isDefined(consumer2);

    assert.strictEqual(consumer.value, 1000);
    assert.strictEqual(consumer2.value, 1000);

    provider.setValue(500);
    assert.strictEqual(consumer.value, 500);
    assert.strictEqual(consumer2.value, 1000); // one-time consumer still has old value
  });

  test(`multiple consumers receive multiple contexts`, async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <multiple-context-provider>
        <simple-context-consumer></simple-context-consumer>
      </multiple-context-provider>
    `;
    document.body.appendChild(container);

    const provider = container.querySelector(
      'multiple-context-provider'
    ) as MultipleContextProvider;
    assert.isDefined(provider);
    const consumer = provider.querySelector(
      'multiple-context-consumer'
    ) as MultipleContextConsumer;

    assert.isDefined(consumer);

    assert.strictEqual(consumer.stringValue, '2000');
    assert.strictEqual(consumer.numberValue, 1000);

    provider.setValueByContext(simpleContext, 500);
    provider.setValueByContext(simpleStringContext, '500');

    assert.strictEqual(consumer.stringValue, '500');
    assert.strictEqual(consumer.numberValue, 500);
  });
});
