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
} from '@lit/context';
import {assert} from 'chai';

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

    // The indirect child now gets the late provider's initial value
    await directChildConsumer.updateComplete;
    assert.equal(directChildConsumer.value, 'grandparent updated');
    assert.equal(indirectChildConsumer.value, 'late provider initial value');

    // Updating the middle provider updates its child, but not its sibling,
    // the direct child.
    const middleProvider = container.querySelector(
      'late-context-provider-4'
    ) as LateContextProvider4Element;
    middleProvider.provide.setValue('late provider updated');
    await directChildConsumer.updateComplete;
    assert.equal(directChildConsumer.value, 'grandparent updated');
    assert.equal(indirectChildConsumer.value, 'late provider updated');

    // Updating the grandparent only propagates to the direct child
    grandparentProvider.provide.setValue('grandparent updated again');
    await directChildConsumer.updateComplete;
    assert.equal(directChildConsumer.value, 'grandparent updated again');
    assert.equal(indirectChildConsumer.value, 'late provider updated');
  });

  test('a child provider created when a consumer renders', async () => {
    // This test verifies that a provider created as a child of an existing
    // provider during rendering does not cause an infinite loop.
    //
    // The scenario: a consumer's render method creates a new provider element
    // as a child. When that child provider connects, it fires a
    // `context-provider` event. The ancestor provider handles that event and
    // currently re-dispatches `context-request` on ALL subscribers. This
    // causes the consumer to re-render, which creates another provider
    // element, which fires another event, causing an infinite loop.

    const childContext = createContext<number>(Symbol('child-context'));

    let renderCount = 0;

    customElements.define(
      'provider-for-loop-test',
      class extends LitElement {
        provide = new ContextProvider(this, {
          context: childContext,
          initialValue: 42,
        });

        protected render() {
          return html`<slot></slot>`;
        }
      }
    );

    @customElement('consumer-that-creates-provider')
    class ConsumerThatCreatesProvider extends LitElement {
      @consume({context: childContext, subscribe: true})
      @property({type: Number})
      value = 0;

      protected render() {
        renderCount++;
        if (renderCount > 50) {
          throw new Error(
            `Render called ${renderCount} times — likely infinite loop`
          );
        }
        const provider = document.createElement('provider-for-loop-test');
        return html`<div>Value: ${this.value}${provider}</div>`;
      }
    }

    container.innerHTML = `
      <provider-for-loop-test>
        <consumer-that-creates-provider></consumer-that-creates-provider>
      </provider-for-loop-test>
    `;

    // Wait for rendering to settle. If the bug is present, this will
    // time out or throw due to infinite loop.
    await new Promise(requestAnimationFrame);

    const consumer = container.querySelector(
      'consumer-that-creates-provider'
    ) as ConsumerThatCreatesProvider;

    assert.strictEqual(consumer.value, 42);
    assert.isBelow(
      renderCount,
      10,
      'Consumer should not re-render excessively'
    );
  });

  test('a late provider does nothing for non-relevant consumers', async () => {
    // When a new provider for context A appears, it should NOT cause
    // re-dispatching of context-request events for consumers of context B.
    // It should also not affect consumers of context A that are NOT
    // descendants of the new provider.

    const contextA = createContext<string>(Symbol('context-a'));
    const contextB = createContext<string>(Symbol('context-b'));

    let consumerBCallCount = 0;

    @customElement('consumer-of-context-a')
    class ConsumerOfContextA extends LitElement {
      consume = new ContextConsumer(this, {
        context: contextA,
        subscribe: true,
        callback: (value) => {
          this.value = value;
        },
      });
      value = 'initial-a';
    }

    @customElement('consumer-of-context-b')
    class ConsumerOfContextB extends LitElement {
      consume = new ContextConsumer(this, {
        context: contextB,
        subscribe: true,
        callback: (value) => {
          this.value = value;
          consumerBCallCount++;
        },
      });
      value = 'initial-b';
    }

    customElements.define(
      'provider-of-both-contexts',
      class extends LitElement {
        provideA = new ContextProvider(this, {
          context: contextA,
          initialValue: 'root-a',
        });
        provideB = new ContextProvider(this, {
          context: contextB,
          initialValue: 'root-b',
        });

        protected render() {
          return html`<slot></slot>`;
        }
      }
    );

    container.innerHTML = `
      <provider-of-both-contexts>
        <consumer-of-context-a></consumer-of-context-a>
        <consumer-of-context-b></consumer-of-context-b>
        <late-provider-for-context-a>
          <consumer-of-context-a></consumer-of-context-a>
        </late-provider-for-context-a>
      </provider-of-both-contexts>
    `;

    await new Promise(requestAnimationFrame);

    const consumerA1 = container.querySelector(
      'provider-of-both-contexts > consumer-of-context-a'
    ) as ConsumerOfContextA;
    const consumerA2 = container.querySelector(
      'late-provider-for-context-a > consumer-of-context-a'
    ) as ConsumerOfContextA;
    const consumerB = container.querySelector(
      'consumer-of-context-b'
    ) as ConsumerOfContextB;

    assert.strictEqual(consumerA1.value, 'root-a');
    assert.strictEqual(consumerA2.value, 'root-a');
    assert.strictEqual(consumerB.value, 'root-b');

    const callCountBeforeLateProvider = consumerBCallCount;

    // Now define a late provider that only provides context A
    customElements.define(
      'late-provider-for-context-a',
      class extends LitElement {
        provide = new ContextProvider(this, {
          context: contextA,
          initialValue: 'late-a',
        });

        protected render() {
          return html`<slot></slot>`;
        }
      }
    );

    await new Promise(requestAnimationFrame);

    // The consumer directly under the root should keep its value unchanged
    assert.strictEqual(consumerA1.value, 'root-a');

    // The consumer under the late provider should get the new value
    assert.strictEqual(consumerA2.value, 'late-a');

    // Consumer B should not have been called again
    assert.strictEqual(
      consumerBCallCount,
      callCountBeforeLateProvider,
      'Consumer of context B should not be re-notified when a context A provider appears'
    );
    assert.strictEqual(consumerB.value, 'root-b');
  });

  test('a late provider only re-dispatches for its own descendants', async () => {
    // When a new provider appears between an existing provider and some
    // consumers, only the consumers that are descendants of the new provider
    // should be re-dispatched. Sibling consumers should not be affected.

    const ctx = createContext<string>(Symbol('descendant-test'));

    let siblingCallCount = 0;
    let descendantCallCount = 0;

    @customElement('ctx-consumer-dispatch-test')
    class CtxConsumerDispatchTest extends LitElement {
      consume: ContextConsumer<typeof ctx, this> | undefined;
      value = '';
    }

    @customElement('ctx-root-provider')
    class CtxRootProvider extends LitElement {
      provide = new ContextProvider(this, {
        context: ctx,
        initialValue: 'root-value',
      });

      protected render() {
        return html`<slot></slot>`;
      }
    }

    container.innerHTML = `
      <ctx-root-provider>
        <ctx-consumer-dispatch-test id="sibling"></ctx-consumer-dispatch-test>
        <late-ctx-middle-provider>
          <ctx-consumer-dispatch-test id="descendant"></ctx-consumer-dispatch-test>
        </late-ctx-middle-provider>
      </ctx-root-provider>
    `;

    const sibling = container.querySelector(
      '#sibling'
    ) as CtxConsumerDispatchTest;
    const descendant = container.querySelector(
      '#descendant'
    ) as CtxConsumerDispatchTest;

    // Set up consumers with tracking callbacks using the same element class
    sibling.consume = new ContextConsumer(sibling, {
      context: ctx,
      subscribe: true,
      callback: (value) => {
        sibling.value = value;
        siblingCallCount++;
      },
    });
    descendant.consume = new ContextConsumer(descendant, {
      context: ctx,
      subscribe: true,
      callback: (value) => {
        descendant.value = value;
        descendantCallCount++;
      },
    });

    await new Promise(requestAnimationFrame);

    assert.strictEqual(sibling.value, 'root-value');
    assert.strictEqual(descendant.value, 'root-value');

    const siblingCallCountBefore = siblingCallCount;
    const descendantCallCountBefore = descendantCallCount;

    // Now define the middle provider
    customElements.define(
      'late-ctx-middle-provider',
      class extends LitElement {
        provide = new ContextProvider(this, {
          context: ctx,
          initialValue: 'middle-value',
        });

        protected render() {
          return html`<slot></slot>`;
        }
      }
    );

    await new Promise(requestAnimationFrame);

    // The descendant should get the new value
    assert.strictEqual(descendant.value, 'middle-value');
    assert.strictEqual(
      descendantCallCount,
      descendantCallCountBefore + 1,
      'Descendant consumer should be called exactly once when a late provider ' +
        'appears as its ancestor'
    );

    // The sibling should NOT have been re-dispatched
    assert.strictEqual(sibling.value, 'root-value');
    assert.strictEqual(
      siblingCallCount,
      siblingCallCountBefore,
      'Sibling consumer should not be re-notified when a late provider ' +
        'appears that is not its ancestor'
    );

    // Verify the root provider still controls the sibling
    const rootProvider = container.querySelector(
      'ctx-root-provider'
    ) as CtxRootProvider;
    rootProvider.provide.setValue('root-updated');

    await new Promise(requestAnimationFrame);

    assert.strictEqual(sibling.value, 'root-updated');
    assert.strictEqual(descendant.value, 'middle-value');
  });

  test('multiple late providers at different levels do not cause extra dispatches', async () => {
    // Root → late middle → late inner → consumer. Each late provider
    // appearing should cause exactly one additional callback to the leaf.

    const ctx = createContext<string>(Symbol('multi-level'));

    let leafCallCount = 0;

    customElements.define(
      'multi-level-root-provider',
      class extends LitElement {
        provide = new ContextProvider(this, {
          context: ctx,
          initialValue: 'root',
        });

        protected render() {
          return html`<slot></slot>`;
        }
      }
    );

    @customElement('multi-level-leaf-consumer')
    class MultiLevelLeafConsumer extends LitElement {
      consume = new ContextConsumer(this, {
        context: ctx,
        subscribe: true,
        callback: (value) => {
          this.value = value;
          leafCallCount++;
        },
      });
      value = '';
    }

    container.innerHTML = `
      <multi-level-root-provider>
        <late-multi-level-middle>
          <late-multi-level-inner>
            <multi-level-leaf-consumer></multi-level-leaf-consumer>
          </late-multi-level-inner>
        </late-multi-level-middle>
      </multi-level-root-provider>
    `;

    await new Promise(requestAnimationFrame);

    const leaf = container.querySelector(
      'multi-level-leaf-consumer'
    ) as MultiLevelLeafConsumer;

    assert.strictEqual(leaf.value, 'root');
    const callCountAfterRoot = leafCallCount;

    // Define the middle provider
    customElements.define(
      'late-multi-level-middle',
      class extends LitElement {
        provide = new ContextProvider(this, {
          context: ctx,
          initialValue: 'middle',
        });

        protected render() {
          return html`<slot></slot>`;
        }
      }
    );

    await new Promise(requestAnimationFrame);

    assert.strictEqual(leaf.value, 'middle');
    assert.strictEqual(leafCallCount, callCountAfterRoot + 1);

    const callCountAfterMiddle = leafCallCount;

    // Define the inner provider (closest to leaf)
    customElements.define(
      'late-multi-level-inner',
      class extends LitElement {
        provide = new ContextProvider(this, {
          context: ctx,
          initialValue: 'inner',
        });

        protected render() {
          return html`<slot></slot>`;
        }
      }
    );

    await new Promise(requestAnimationFrame);

    assert.strictEqual(leaf.value, 'inner');
    assert.strictEqual(
      leafCallCount,
      callCountAfterMiddle + 1,
      'Leaf consumer should only be called once when inner provider appears'
    );
  });
});
