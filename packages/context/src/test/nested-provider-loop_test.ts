/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Tests for the infinite render loop bug that occurs when a consumer element
 * manually creates and renders a context provider element inside its own
 * shadow DOM, while the consumer is a light DOM child of an ancestor provider.
 *
 * See: https://github.com/lit/lit/issues/5221
 */

import {LitElement, html} from 'lit';
import {property} from 'lit/decorators/property.js';

import {
  ContextProvider,
  ContextConsumer,
  ContextRoot,
  createContext,
  provide,
  consume,
} from '@lit/context';
import {assert} from 'chai';

const loopContext = createContext<number>('loop-test-context');

// --- Test Elements ---

/**
 * An outer provider that renders a slot for light DOM children.
 */
class OuterProviderElement extends LitElement {
  provider = new ContextProvider(this, {
    context: loopContext,
    initialValue: 42,
  });

  protected render() {
    return html`<slot></slot>`;
  }
}
customElements.define('loop-outer-provider', OuterProviderElement);

/**
 * A consumer that manually creates a provider element via
 * document.createElement and appends it to its shadow DOM.
 * This is the pattern that triggers the infinite loop bug.
 */
class ConsumerWithInnerProviderElement extends LitElement {
  consumer = new ContextConsumer(this, {
    context: loopContext,
    subscribe: true,
    callback: (value) => {
      this.contextValue = value;
    },
  });

  @property({type: Number})
  contextValue?: number;

  renderCount = 0;

  protected render() {
    this.renderCount++;

    // Create a provider element manually (the key trigger for the bug).
    const innerProvider = document.createElement(
      'loop-inner-provider'
    ) as InnerProviderElement;
    innerProvider.setAttribute('value', '99');

    return html`
      <div id="consumer-content">
        Consumed: ${this.contextValue} ${innerProvider}
      </div>
    `;
  }
}
customElements.define(
  'loop-consumer-with-inner-provider',
  ConsumerWithInnerProviderElement
);

/**
 * The inner provider element that gets dynamically created inside
 * the consumer's render.
 */
class InnerProviderElement extends LitElement {
  provider = new ContextProvider(this, {
    context: loopContext,
    initialValue: 99,
  });

  @property({type: Number})
  value = 99;

  protected render() {
    return html`<slot></slot>`;
  }
}
customElements.define('loop-inner-provider', InnerProviderElement);

// --- Additional test elements for decorator-based tests ---

const decoratorContext = createContext<string>('decorator-loop-context');

class DecoratorOuterProvider extends LitElement {
  @provide({context: decoratorContext})
  @property()
  value = 'outer';

  protected render() {
    return html`<slot></slot>`;
  }
}
customElements.define('dec-loop-outer-provider', DecoratorOuterProvider);

class DecoratorConsumerWithInnerProvider extends LitElement {
  @consume({context: decoratorContext, subscribe: true})
  @property()
  contextValue?: string;

  renderCount = 0;

  protected render() {
    this.renderCount++;
    const inner = document.createElement(
      'dec-loop-inner-provider'
    ) as DecoratorInnerProvider;
    return html`<div>${this.contextValue}${inner}</div>`;
  }
}
customElements.define(
  'dec-loop-consumer-with-inner',
  DecoratorConsumerWithInnerProvider
);

class DecoratorInnerProvider extends LitElement {
  @provide({context: decoratorContext})
  @property()
  value = 'inner';

  protected render() {
    return html`<slot></slot>`;
  }
}
customElements.define('dec-loop-inner-provider', DecoratorInnerProvider);

// --- Tests ---

suite('nested provider infinite loop (issue #5221)', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    container.remove();
  });

  test('consumer with manually created inner provider does not loop', async () => {
    container.innerHTML = `
      <loop-outer-provider>
        <loop-consumer-with-inner-provider></loop-consumer-with-inner-provider>
      </loop-outer-provider>
    `;

    const outerProvider = container.querySelector(
      'loop-outer-provider'
    ) as OuterProviderElement;
    const consumer = container.querySelector(
      'loop-consumer-with-inner-provider'
    ) as ConsumerWithInnerProviderElement;

    await outerProvider.updateComplete;
    await consumer.updateComplete;
    // Allow any additional microtasks to settle
    await new Promise((r) => setTimeout(r, 0));
    await consumer.updateComplete;

    // Consumer should have rendered a bounded number of times.
    // Without the fix, this would be unbounded (infinite loop).
    assert.isBelow(
      consumer.renderCount,
      10,
      'consumer should not enter an infinite render loop'
    );

    // Consumer should have received the outer provider's value
    assert.strictEqual(consumer.contextValue, 42);
  });

  test('outer provider value updates still propagate correctly', async () => {
    container.innerHTML = `
      <loop-outer-provider>
        <loop-consumer-with-inner-provider></loop-consumer-with-inner-provider>
      </loop-outer-provider>
    `;

    const outerProvider = container.querySelector(
      'loop-outer-provider'
    ) as OuterProviderElement;
    const consumer = container.querySelector(
      'loop-consumer-with-inner-provider'
    ) as ConsumerWithInnerProviderElement;

    await outerProvider.updateComplete;
    await consumer.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await consumer.updateComplete;

    // Verify initial value
    assert.strictEqual(consumer.contextValue, 42);

    // Update the outer provider's value
    const renderCountBefore = consumer.renderCount;
    outerProvider.provider.setValue(100);
    await consumer.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await consumer.updateComplete;

    // Consumer should have received the updated value
    assert.strictEqual(consumer.contextValue, 100);

    // And should have rendered a bounded number of additional times
    const additionalRenders = consumer.renderCount - renderCountBefore;
    assert.isBelow(
      additionalRenders,
      10,
      'value update should not cause unbounded renders'
    );
  });

  test('decorator-based consumer with inner provider does not loop', async () => {
    container.innerHTML = `
      <dec-loop-outer-provider>
        <dec-loop-consumer-with-inner></dec-loop-consumer-with-inner>
      </dec-loop-outer-provider>
    `;

    const outerProvider = container.querySelector(
      'dec-loop-outer-provider'
    ) as DecoratorOuterProvider;
    const consumer = container.querySelector(
      'dec-loop-consumer-with-inner'
    ) as DecoratorConsumerWithInnerProvider;

    await outerProvider.updateComplete;
    await consumer.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await consumer.updateComplete;

    assert.isBelow(
      consumer.renderCount,
      10,
      'decorator-based consumer should not enter an infinite render loop'
    );

    assert.strictEqual(consumer.contextValue, 'outer');
  });

  test('multiple consumers with inner providers do not loop', async () => {
    container.innerHTML = `
      <loop-outer-provider>
        <loop-consumer-with-inner-provider id="c1"></loop-consumer-with-inner-provider>
        <loop-consumer-with-inner-provider id="c2"></loop-consumer-with-inner-provider>
      </loop-outer-provider>
    `;

    const outerProvider = container.querySelector(
      'loop-outer-provider'
    ) as OuterProviderElement;
    const consumer1 = container.querySelector(
      '#c1'
    ) as ConsumerWithInnerProviderElement;
    const consumer2 = container.querySelector(
      '#c2'
    ) as ConsumerWithInnerProviderElement;

    await outerProvider.updateComplete;
    await consumer1.updateComplete;
    await consumer2.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await consumer1.updateComplete;
    await consumer2.updateComplete;

    assert.isBelow(consumer1.renderCount, 10, 'first consumer should not loop');
    assert.isBelow(
      consumer2.renderCount,
      10,
      'second consumer should not loop'
    );

    assert.strictEqual(consumer1.contextValue, 42);
    assert.strictEqual(consumer2.contextValue, 42);
  });

  test('context-provider event propagation is handled correctly', async () => {
    // Track context-provider events that reach the container
    const providerEvents: Event[] = [];
    container.addEventListener('context-provider', (e) => {
      providerEvents.push(e);
    });

    container.innerHTML = `
      <loop-outer-provider>
        <loop-consumer-with-inner-provider></loop-consumer-with-inner-provider>
      </loop-outer-provider>
    `;

    const outerProvider = container.querySelector(
      'loop-outer-provider'
    ) as OuterProviderElement;
    const consumer = container.querySelector(
      'loop-consumer-with-inner-provider'
    ) as ConsumerWithInnerProviderElement;

    await outerProvider.updateComplete;
    await consumer.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await consumer.updateComplete;

    // Provider events should be bounded — not growing unboundedly
    assert.isBelow(
      providerEvents.length,
      20,
      'context-provider events should not fire unboundedly'
    );
  });

  test('re-parenting to a new closer provider still works', async () => {
    // This test ensures the fix does not break the legitimate re-parenting case
    // (Case 1: outer-provider -> new-provider -> consumer)
    const reparentContext = createContext<string>('reparent-test-context');

    class ReparentOuterProvider extends LitElement {
      provider = new ContextProvider(this, {
        context: reparentContext,
        initialValue: 'outer',
      });
      protected render() {
        return html`<slot></slot>`;
      }
    }
    customElements.define('reparent-outer-provider', ReparentOuterProvider);

    class ReparentConsumer extends LitElement {
      consumer = new ContextConsumer(this, {
        context: reparentContext,
        subscribe: true,
        callback: (value) => {
          this.contextValue = value;
        },
      });

      @property()
      contextValue?: string;

      protected render() {
        return html`${this.contextValue}`;
      }
    }
    customElements.define('reparent-consumer', ReparentConsumer);

    container.innerHTML = `
      <reparent-outer-provider>
        <reparent-consumer></reparent-consumer>
      </reparent-outer-provider>
    `;

    const outerProvider = container.querySelector(
      'reparent-outer-provider'
    ) as ReparentOuterProvider;
    const consumer = container.querySelector(
      'reparent-consumer'
    ) as ReparentConsumer;

    await outerProvider.updateComplete;
    await consumer.updateComplete;

    // Consumer initially gets outer provider's value
    assert.strictEqual(consumer.contextValue, 'outer');

    // Now insert a closer provider between outer and consumer
    const middleProvider = document.createElement('div');
    outerProvider.appendChild(middleProvider);
    new ContextProvider(middleProvider, {
      context: reparentContext,
      initialValue: 'middle',
    });
    middleProvider.appendChild(consumer);

    await consumer.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await consumer.updateComplete;

    // Consumer should now get the middle (closer) provider's value
    assert.strictEqual(consumer.contextValue, 'middle');
  });
});

suite('nested provider with ContextRoot (issue #5221)', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    new ContextRoot().attach(container);
  });

  teardown(() => {
    container.remove();
  });

  test('consumer with inner provider does not loop with ContextRoot', async () => {
    container.innerHTML = `
      <loop-outer-provider>
        <loop-consumer-with-inner-provider></loop-consumer-with-inner-provider>
      </loop-outer-provider>
    `;

    const outerProvider = container.querySelector(
      'loop-outer-provider'
    ) as OuterProviderElement;
    const consumer = container.querySelector(
      'loop-consumer-with-inner-provider'
    ) as ConsumerWithInnerProviderElement;

    await outerProvider.updateComplete;
    await consumer.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await consumer.updateComplete;

    assert.isBelow(
      consumer.renderCount,
      10,
      'consumer should not loop even with ContextRoot active'
    );
    assert.strictEqual(consumer.contextValue, 42);
  });
});
