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

import {PropertyValues, UpdatingElement} from 'updating-element';
import * as callbacks from '../../callbacks/callbacks.js';
import {generateElementName} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

suite('UpdatingElement lifecycle callbacks', () => {
  class A extends UpdatingElement {
    static properties = {foo: {}};
    foo = 'foo';
    updateCount = 0;
    updatedCount = 0;
    connectedCount = 0;
    disconnectedCount = 0;

    connectedCallback() {
      this.connectedCount++;
      super.connectedCallback();
    }

    disconnectedCallback() {
      this.disconnectedCount++;
      super.disconnectedCallback();
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

  test('connected/disconnected callbacks', () => {
    let connectedCount = 0;
    callbacks.addConnectedCallback(el, () => connectedCount++);
    let disconnectedCount = 0;
    callbacks.addDisconnectedCallback(el, () => disconnectedCount++);
    assert.equal(el.connectedCount, 1);
    assert.equal(el.disconnectedCount, 0);
    assert.equal(connectedCount, 0);
    assert.equal(disconnectedCount, 0);
    container.removeChild(el);
    assert.equal(el.connectedCount, 1);
    assert.equal(el.disconnectedCount, 1);
    assert.equal(connectedCount, 0);
    assert.equal(disconnectedCount, 1);
    container.appendChild(el);
    assert.equal(el.connectedCount, 2);
    assert.equal(el.disconnectedCount, 1);
    assert.equal(connectedCount, 1);
    assert.equal(disconnectedCount, 1);
  });

  test('update/updated callbacks', async () => {
    let updateCount = 0;
    let updateChangedProperties: PropertyValues | null = null;
    let updatedChangedProperties: PropertyValues | null = null;
    callbacks.addUpdateCallback(el, (changedProperties: PropertyValues) => {
      updateChangedProperties = changedProperties;
      updateCount++;
    });
    let updatedCount = 0;
    callbacks.addUpdatedCallback(el, (changedProperties: PropertyValues) => {
      updatedChangedProperties = changedProperties;
      updatedCount++;
    });
    assert.equal(el.updateCount, 1);
    assert.equal(el.updatedCount, 1);
    assert.equal(updateCount, 0);
    assert.equal(updatedCount, 0);
    el.foo = 'new';
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
    assert.equal(el.updatedCount, 2);
    assert.equal(updateCount, 1);
    const expectedChangedProperties = new Map([['foo', 'foo']]);
    assert.deepEqual(updateChangedProperties, expectedChangedProperties);
    assert.equal(updatedCount, 1);
    assert.deepEqual(updatedChangedProperties, expectedChangedProperties);
  });

  test('callbacks added multiple times are run once', async () => {
    let connectedCount = 0;
    const connectedCallback = () => {
      connectedCount++;
    };
    let disconnectedCount = 0;
    const disconnectedCallback = () => {
      disconnectedCount++;
    };
    let updateCount = 0;
    const updateCallback = () => {
      updateCount++;
    };
    let updatedCount = 0;
    const updatedCallback = () => {
      updatedCount++;
    };
    callbacks.addConnectedCallback(el, connectedCallback);
    callbacks.addConnectedCallback(el, connectedCallback);
    callbacks.addDisconnectedCallback(el, disconnectedCallback);
    callbacks.addDisconnectedCallback(el, disconnectedCallback);
    callbacks.addUpdateCallback(el, updateCallback);
    callbacks.addUpdateCallback(el, updateCallback);
    callbacks.addUpdatedCallback(el, updatedCallback);
    callbacks.addUpdatedCallback(el, updatedCallback);
    container.removeChild(el);
    assert.equal(disconnectedCount, 1);
    container.appendChild(el);
    assert.equal(connectedCount, 1);
    el.foo = 'foo2';
    await el.updateComplete;
    assert.equal(updateCount, 1);
    assert.equal(updatedCount, 1);
  });

  test('callbacks can be removed', async () => {
    let connectedCount = 0;
    const connectedCallback = () => {
      connectedCount++;
    };
    let disconnectedCount = 0;
    const disconnectedCallback = () => {
      disconnectedCount++;
    };
    let updateCount = 0;
    const updateCallback = () => {
      updateCount++;
    };
    let updatedCount = 0;
    const updatedCallback = () => {
      updatedCount++;
    };
    callbacks.addConnectedCallback(el, connectedCallback);
    callbacks.addDisconnectedCallback(el, disconnectedCallback);
    callbacks.addUpdateCallback(el, updateCallback);
    callbacks.addUpdatedCallback(el, updatedCallback);
    container.removeChild(el);
    assert.equal(disconnectedCount, 1);
    container.appendChild(el);
    assert.equal(connectedCount, 1);
    el.foo = 'foo2';
    await el.updateComplete;
    assert.equal(updateCount, 1);
    assert.equal(updatedCount, 1);
    callbacks.removeConnectedCallback(el, connectedCallback);
    callbacks.removeDisconnectedCallback(el, disconnectedCallback);
    callbacks.removeUpdateCallback(el, updateCallback);
    callbacks.removeUpdatedCallback(el, updatedCallback);
    container.removeChild(el);
    container.appendChild(el);
    el.foo = 'foo2';
    await el.updateComplete;
    assert.equal(disconnectedCount, 1);
    assert.equal(connectedCount, 1);
    assert.equal(updateCount, 1);
    assert.equal(updatedCount, 1);
  });
});
