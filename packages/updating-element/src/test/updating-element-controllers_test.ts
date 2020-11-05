/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

import {
  PropertyValues,
  UpdatingElement,
  Controller,
} from '../updating-element.js';
import {generateElementName} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

suite('UpdatingElement controllers', () => {
  class MyController implements Controller {
    host: UpdatingElement;
    willUpdateCount = 0;
    updateCount = 0;
    updatedCount = 0;
    connectedCount = 0;
    disconnectedCount = 0;
    willUpdateChangedProperties?: PropertyValues;
    updateChangedProperties?: PropertyValues;
    updatedChangedProperties?: PropertyValues;

    constructor(host: UpdatingElement) {
      this.host = host;
      this.host.addController(this);
    }

    connectedCallback() {
      this.connectedCount++;
    }

    disconnectedCallback() {
      this.disconnectedCount++;
    }

    willUpdate(changedProperties: PropertyValues) {
      this.willUpdateCount++;
      this.willUpdateChangedProperties = changedProperties;
    }

    update(changedProperties: PropertyValues) {
      this.updateCount++;
      this.updateChangedProperties = changedProperties;
    }

    updated(changedProperties: PropertyValues) {
      this.updatedCount++;
      this.updatedChangedProperties = changedProperties;
    }
  }

  class A extends UpdatingElement {
    static properties = {foo: {}};
    foo = 'foo';
    willUpdateCount = 0;
    updateCount = 0;
    updatedCount = 0;
    connectedCount = 0;
    disconnectedCount = 0;

    controller = new MyController(this);

    connectedCallback() {
      this.connectedCount++;
      super.connectedCallback();
    }

    disconnectedCallback() {
      this.disconnectedCount++;
      super.disconnectedCallback();
    }

    willUpdate(changedProperties: PropertyValues) {
      this.willUpdateCount++;
      super.willUpdate(changedProperties);
    }

    update(changedProperties: PropertyValues) {
      this.updateCount++;
      super.update(changedProperties);
    }

    updated(changedProperties: PropertyValues) {
      this.updatedCount++;
      super.updated(changedProperties);
    }
  }
  customElements.define(generateElementName(), A);

  let container: HTMLElement;
  let el!: A;

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    el = new A();
    container.appendChild(el);
    await el.updateComplete;
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('controllers can implement connectedCallback/disconnectedCallback', () => {
    assert.equal(el.connectedCount, 1);
    assert.equal(el.disconnectedCount, 0);
    assert.equal(el.controller.connectedCount, 1);
    assert.equal(el.controller.disconnectedCount, 0);
    container.removeChild(el);
    assert.equal(el.connectedCount, 1);
    assert.equal(el.disconnectedCount, 1);
    assert.equal(el.controller.connectedCount, 1);
    assert.equal(el.controller.disconnectedCount, 1);
    container.appendChild(el);
    assert.equal(el.connectedCount, 2);
    assert.equal(el.disconnectedCount, 1);
    assert.equal(el.controller.connectedCount, 2);
    assert.equal(el.controller.disconnectedCount, 1);
  });

  test('controllers can implement willUpdate/update/updated', async () => {
    assert.equal(el.willUpdateCount, 1);
    assert.equal(el.updateCount, 1);
    assert.equal(el.updatedCount, 1);
    assert.equal(el.controller.willUpdateCount, 1);
    assert.equal(el.controller.updateCount, 1);
    assert.equal(el.controller.updatedCount, 1);
    el.foo = 'new';
    await el.updateComplete;
    assert.equal(el.willUpdateCount, 2);
    assert.equal(el.updateCount, 2);
    assert.equal(el.updatedCount, 2);
    assert.equal(el.controller.willUpdateCount, 2);
    assert.equal(el.controller.updateCount, 2);
    assert.equal(el.controller.updatedCount, 2);
    const expectedChangedProperties = new Map([['foo', 'foo']]);
    assert.deepEqual(
      el.controller.willUpdateChangedProperties,
      expectedChangedProperties
    );
    assert.deepEqual(
      el.controller.updateChangedProperties,
      expectedChangedProperties
    );
    assert.deepEqual(
      el.controller.updatedChangedProperties,
      expectedChangedProperties
    );
  });
});
