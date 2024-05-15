/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {html, LitElement} from 'lit';
import {ContextProvider} from '@lit/context';
import {
  store,
  increment,
  toggle,
  reset,
  type RootState,
  type AppDispatch,
} from '../store.js';

import {storeContext, select, dispatch} from '@lit-labs/redux';

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

class SelectElement extends LitElement {
  @select((state: RootState) => state.counter.value)
  count!: number;

  renderCount = 0;

  override render() {
    this.renderCount += 1;
    return html`<p>${this.count}</p>`;
  }
}
customElements.define('select-element', SelectElement);

class SelectAccessor extends LitElement {
  @select((state: RootState) => state.counter.value)
  accessor count!: number;

  renderCount = 0;

  override render() {
    this.renderCount += 1;
    return html`<p>${this.count}</p>`;
  }
}
customElements.define('select-accessor', SelectAccessor);

class SelectOption extends LitElement {
  @select({selector: (state: RootState) => state.counter.value})
  count!: number;

  renderCount = 0;

  override render() {
    this.renderCount += 1;
    return html`<p>${this.count}</p>`;
  }
}
customElements.define('select-option', SelectOption);

class SelectOptionAccessor extends LitElement {
  @select({selector: (state: RootState) => state.counter.value})
  accessor count!: number;

  renderCount = 0;

  override render() {
    this.renderCount += 1;
    return html`<p>${this.count}</p>`;
  }
}
customElements.define('select-option-accessor', SelectOptionAccessor);

class DispatchElement extends LitElement {
  @dispatch()
  dispatch!: AppDispatch;

  renderCount = 0;

  override render() {
    this.renderCount += 1;
    return;
  }
}
customElements.define('dispatch-element', DispatchElement);

class DispatchAccessor extends LitElement {
  @dispatch()
  accessor dispatch!: AppDispatch;

  renderCount = 0;

  override render() {
    this.renderCount += 1;
    return;
  }
}
customElements.define('dispatch-accessor', DispatchAccessor);

[
  'select-element',
  'select-accessor',
  'select-option',
  'select-option-accessor',
].forEach((tag) => {
  suite(`@select with <${tag}>`, () => {
    let container: HTMLElement;
    let provider: StoreProvider;
    let el: SelectElement | SelectAccessor | SelectOption;

    setup(async () => {
      container = document.createElement('div');
      container.innerHTML = `
        <store-provider>
          <${tag}></${tag}>
        </store-provider>
      `;
      document.body.appendChild(container);
      provider = container.querySelector('store-provider')!;
      el = container.querySelector(tag)!;
      await provider.updateComplete;
      await el.updateComplete;
    });

    teardown(() => {
      store.dispatch(reset());
      document.body.removeChild(container);
    });

    test('it selects a value from store', () => {
      assert.equal(el.count, store.getState().counter.value);
    });

    test('updates selected value when store updates', () => {
      store.dispatch(increment());
      assert.equal(el.count, store.getState().counter.value);
    });

    test('updating value causes re-render', async () => {
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
  });
});

['dispatch-element', 'dispatch-accessor'].forEach((tag) => {
  suite(`@dispatch with <${tag}>`, () => {
    let container: HTMLElement;
    let provider: StoreProvider;
    let el: DispatchElement | DispatchAccessor;

    setup(async () => {
      container = document.createElement('div');
      container.innerHTML = `
        <store-provider>
          <${tag}></${tag}>
        </store-provider>
      `;
      document.body.appendChild(container);
      provider = container.querySelector('store-provider')!;
      el = container.querySelector(tag)!;
      await provider.updateComplete;
      await el.updateComplete;
    });

    teardown(() => {
      store.dispatch(reset());
      document.body.removeChild(container);
    });

    test('can dispatch actions', () => {
      assert.equal(store.getState().counter.value, 0);
      el.dispatch(increment());
      assert.equal(store.getState().counter.value, 1);
    });

    test('dispatching does not re-render element', async () => {
      assert.equal(el.renderCount, 1);
      el.dispatch(increment());
      await el.updateComplete;
      assert.equal(el.renderCount, 1);
    });
  });
});
