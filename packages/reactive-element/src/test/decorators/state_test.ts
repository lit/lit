/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement, PropertyValues} from '@lit/reactive-element';
import {state} from '@lit/reactive-element/decorators/state.js';
import {generateElementName} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

suite('@state', () => {
  let container: HTMLElement;
  let el: E;

  const hasChanged = (value: any, old: any) => old === undefined || value > old;

  class E extends ReactiveElement {
    @state() prop = 'prop';
    @state({hasChanged}) hasChangedProp = 10;

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

  test('triggers update', async () => {
    assert.equal(el.updateCount, 1);
    el.prop = 'change';
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
  });

  test('uses hasChanged', async () => {
    assert.equal(el.updateCount, 1);
    el.hasChangedProp = 100;
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
    el.hasChangedProp = 0;
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
  });

  test('does not set via attribute', async () => {
    el.setAttribute('prop', 'attr');
    assert.equal(el.prop, 'prop');
    await el.updateComplete;
    assert.equal(el.updateCount, 1);
  });
});
