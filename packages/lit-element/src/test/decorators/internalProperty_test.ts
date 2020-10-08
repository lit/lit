/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {html, LitElement, PropertyValues} from '../../lit-element.js';
import {internalProperty} from '../../lib/decorators/internalProperty.js';
import {canTestLitElement, generateElementName} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

(canTestLitElement ? suite : suite.skip)('@internalProperty', () => {
  let container: HTMLElement;
  let el: E;

  const hasChanged = (value: any, old: any) => old === undefined || value > old;

  class E extends LitElement {
    @internalProperty() prop = 'prop';
    @internalProperty({hasChanged}) hasChangedProp = 10;

    updateCount = 0;

    update(changed: PropertyValues) {
      this.updateCount++;
      super.update(changed);
    }

    render() {
      return html``;
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
