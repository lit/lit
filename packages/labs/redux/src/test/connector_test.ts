/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {html, LitElement} from 'lit';
import {ContextProvider} from '@lit/context';
import {store, increment, toggle, reset, AppStore} from './store.js';

import {storeContext, Connector} from '@lit-labs/redux';

class StoreProvider extends LitElement {
  _store = new ContextProvider(this, {
    context: storeContext,
    initialValue: store,
  });

  override render() {
    return html`<slot></slot>`;
  }
}
customElements.define('store-provider', StoreProvider);

class ConnectedElement extends LitElement {
  connector = new Connector(this, {selector: (state) => state.counter.value});
  renderCount = 0;

  override render() {
    this.renderCount += 1;
    return html`<p>${this.connector.selected}</p>`;
  }
}
customElements.define('connected-element', ConnectedElement);

class NoSelector extends LitElement {
  connector = new Connector(this);
  renderCount = 0;
  override render() {
    this.renderCount += 1;
  }
}
customElements.define('no-selector', NoSelector);

class ComplexSelector extends LitElement {
  connector = new Connector(this, {
    selector: (state) => ({value: state.counter.value}),
  });
  renderCount = 0;
  override render() {
    this.renderCount += 1;
  }
}
customElements.define('complex-selector', ComplexSelector);

class CustomEquality extends LitElement {
  connector = new Connector(this, {
    selector: (state) => ({value: state.counter.value}),
    equalityCheck: (a, b) => a.value === b.value,
  });
  renderCount = 0;
  override render() {
    this.renderCount += 1;
  }
}
customElements.define('custom-equality', CustomEquality);

suite('Connector basic', () => {
  let container: HTMLElement;
  let provider: StoreProvider;
  let el: ConnectedElement;

  setup(async () => {
    container = document.createElement('div');
    container.innerHTML = `
      <store-provider>
        <connected-element></connected-element>
      </store-provider>
    `;
    document.body.appendChild(container);
    provider = container.querySelector('store-provider')!;
    el = container.querySelector('connected-element')!;
    await provider.updateComplete;
    await el.updateComplete;
  });

  teardown(() => {
    store.dispatch(reset());
    document.body.removeChild(container);
  });

  test('obtains selected value from store', () => {
    assert.equal(el.connector.selected, store.getState().counter.value);
  });

  test('updates selected value with new one on store update', () => {
    store.dispatch(increment());
    assert.equal(el.connector.selected, 1);
  });

  test('updated value actually causes a re-render', async () => {
    assert.equal(el.renderCount, 1);
    assert.include(el.shadowRoot!.querySelector('p')!.innerText, '0');
    store.dispatch(increment());
    await el.updateComplete;
    assert.equal(el.renderCount, 2);
    assert.include(el.shadowRoot!.querySelector('p')!.innerText, '1');
  });

  test('unrelated state change does not cause re-render', async () => {
    assert.equal(el.renderCount, 1);
    store.dispatch(toggle()); // this only updates a flag, not the count value.
    await el.updateComplete;
    assert.equal(el.renderCount, 1);
  });

  test('able to dispatch action', () => {
    el.connector.dispatch(increment());
    assert.equal(store.getState().counter.value, 1);
  });
});

suite('Connector without selector', () => {
  let container: HTMLElement;
  let provider: StoreProvider;
  let el: NoSelector;

  setup(async () => {
    container = document.createElement('div');
    container.innerHTML = `
      <store-provider>
        <no-selector></no-selector>
      </store-provider>
    `;
    document.body.appendChild(container);
    provider = container.querySelector('store-provider')!;
    el = container.querySelector('no-selector')!;
    await provider.updateComplete;
    await el.updateComplete;
  });

  teardown(() => {
    store.dispatch(reset());
    document.body.removeChild(container);
  });

  test('provides no selected value', async () => {
    assert.isUndefined(el.connector.selected);
  });

  test('able to dispatch action', () => {
    el.connector.dispatch(increment());
    assert.equal(store.getState().counter.value, 1);
  });

  test('store update does not cause re-render', async () => {
    assert.equal(el.renderCount, 1);
    store.dispatch(increment());
    await el.updateComplete;
    assert.equal(el.renderCount, 1);
  });
});

suite('Connector with complex selector', () => {
  let container: HTMLElement;
  let provider: StoreProvider;
  let el: ComplexSelector;

  setup(async () => {
    container = document.createElement('div');
    container.innerHTML = `
      <store-provider>
        <complex-selector></complex-selector>
      </store-provider>
    `;
    document.body.appendChild(container);
    provider = container.querySelector('store-provider')!;
    el = container.querySelector('complex-selector')!;
    await provider.updateComplete;
    await el.updateComplete;
  });

  teardown(() => {
    store.dispatch(reset());
    document.body.removeChild(container);
  });

  test('selector returning new object always re-renders', async () => {
    assert.equal(el.renderCount, 1);
    assert.equal(el.connector.selected.value, 0);
    store.dispatch(toggle());
    await el.updateComplete;
    assert.equal(el.renderCount, 2);
    assert.equal(el.connector.selected.value, 0);
  });
});

suite('Connector with custom equality', () => {
  let container: HTMLElement;
  let provider: StoreProvider;
  let el: CustomEquality;

  setup(async () => {
    container = document.createElement('div');
    container.innerHTML = `
      <store-provider>
        <custom-equality></custom-equality>
      </store-provider>
    `;
    document.body.appendChild(container);
    provider = container.querySelector('store-provider')!;
    el = container.querySelector('custom-equality')!;
    await provider.updateComplete;
    await el.updateComplete;
  });

  teardown(() => {
    store.dispatch(reset());
    document.body.removeChild(container);
  });

  test('prevent re-render on store update with same value', async () => {
    assert.equal(el.renderCount, 1);
    assert.equal(el.connector.selected.value, 0);
    store.dispatch(toggle());
    await el.updateComplete;
    assert.equal(el.renderCount, 1);
    assert.equal(el.connector.selected.value, 0);
  });

  test('re-render on store update with different value', async () => {
    assert.equal(el.renderCount, 1);
    assert.equal(el.connector.selected.value, 0);
    store.dispatch(increment());
    await el.updateComplete;
    assert.equal(el.renderCount, 2);
    assert.equal(el.connector.selected.value, 1);
  });
});

suite('Connector without provider', () => {
  test('errors when connecting without store provided', () => {
    let error: Error;

    class CaptureConnected extends ConnectedElement {
      override connectedCallback() {
        try {
          super.connectedCallback();
        } catch (e) {
          error = e as Error;
        }
      }
    }
    customElements.define('capture-connected', CaptureConnected);

    const div = document.createElement('div');
    div.innerHTML = `<capture-connected></capture-connected>`;
    document.body.appendChild(div);

    assert.match(
      error!.message,
      /Connector must be used in a component below a context provider that provides a Redux store/
    );

    document.body.removeChild(div);
  });
});

suite('Connector.withStoreType', () => {
  test('returns itself', () => {
    assert.equal(Connector, Connector.withStoreType());
  });

  // type only test to be checked at compile time
  test('correctly type checks selector with provided store type', () => {
    const TypedConnector = Connector.withStoreType<AppStore>();
    class WithTypedSelector extends LitElement {
      connector = new TypedConnector(this, {
        // @ts-expect-error `foo` does not exist on state
        selector: (state) => state.foo,
      });
    }
    return WithTypedSelector;
  });
});
