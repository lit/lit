/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {html, LitElement} from 'lit';
import {ContextProvider} from '@lit/context';
import {store, increment, reset} from './store.js';

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
  _connector = new Connector(this, {selector: (state) => state.counter.value});
}
customElements.define('connected-element', ConnectedElement);

suite('Connector', () => {
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
    assert.equal(el._connector.selected, store.getState().counter.value);
  });

  test('updates selected value with new one on store update', () => {
    store.dispatch(increment());
    assert.equal(el._connector.selected, 1);
  });

  test('able to dispatch action', () => {
    el._connector.dispatch(increment());
    assert.equal(store.getState().counter.value, 1);
  });
});
