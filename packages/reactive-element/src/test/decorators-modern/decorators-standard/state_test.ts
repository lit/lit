/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement, PropertyValues} from '@lit/reactive-element';
import {state} from '@lit/reactive-element/decorators/state.js';
import {generateElementName} from '../../test-helpers.js';
import {assert} from 'chai';

suite('@state', () => {
  let container: HTMLElement;
  let el: E;

  const hasChanged = (value: any, old: any) => old === undefined || value > old;

  class E extends ReactiveElement {
    @state()
    accessor #prop: string | undefined = undefined;

    get prop() {
      return this.#prop;
    }

    set prop(v) {
      this.#prop = v;
    }

    @state({hasChanged})
    accessor #hasChangedProp = 10;

    get hasChangedProp() {
      return this.#hasChangedProp;
    }

    set hasChangedProp(v) {
      this.#hasChangedProp = v;
    }

    #setterValue: string | undefined = undefined;

    @state()
    set #setter(v: string | undefined) {
      this.#setterValue = v;
    }
    get #setter() {
      return this.#setterValue;
    }

    set setter(v: string | undefined) {
      this.#setter = v;
    }
    get setter() {
      return this.#setter;
    }

    updateCount = 0;

    override update(changed: PropertyValues) {
      this.updateCount++;
      super.update(changed);
    }
  }
  customElements.define(generateElementName(), E);

  setup(async () => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    el = new E();
    container.appendChild(el);
    await el.updateComplete;
  });

  teardown(() => {
    if (container !== undefined) {
      container.parentElement!.removeChild(container);
      (container as any) = undefined;
    }
  });

  test('triggers accessor update', async () => {
    assert.equal(el.updateCount, 1);
    el.prop = 'change';
    await el.updateComplete;
    // If we don't read the new value of private accessors correctly, this will
    // fail.
    assert.equal(el.updateCount, 2);
  });

  test('uses hasChanged', async () => {
    assert.equal(el.updateCount, 1);
    el.hasChangedProp = 100;
    await el.updateComplete;
    // If we don't read the new value of private accessors correctly, this will
    // fail.
    assert.equal(el.updateCount, 2);
    el.hasChangedProp = 0;
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
  });

  test('triggers setter update', async () => {
    assert.equal(el.updateCount, 1);
    el.setter = 'change';
    await el.updateComplete;
    // If we don't read the new value of private accessors correctly, this will
    // fail.
    assert.equal(el.updateCount, 2);
  });
});
