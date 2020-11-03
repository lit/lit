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
  ControllerHost,
} from '../updating-element.js';
import {generateElementName} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

suite('UpdatingElement controllers', () => {
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

  test('controllers can implement onConnected/onDisconnected', () => {
    let connectedCount = 0;
    let disconnectedCount = 0;
    el.addController({
      onConnected: () => connectedCount++,
      onDisconnected: () => disconnectedCount++,
    });
    assert.equal(el.connectedCount, 1);
    assert.equal(el.disconnectedCount, 0);
    assert.equal(connectedCount, 1);
    assert.equal(disconnectedCount, 0);
    container.removeChild(el);
    assert.equal(el.connectedCount, 1);
    assert.equal(el.disconnectedCount, 1);
    assert.equal(connectedCount, 1);
    assert.equal(disconnectedCount, 1);
    container.appendChild(el);
    assert.equal(el.connectedCount, 2);
    assert.equal(el.disconnectedCount, 1);
    assert.equal(connectedCount, 2);
    assert.equal(disconnectedCount, 1);
  });

  test('controllers can implement onUpdate/onUpdated', async () => {
    let updateCount = 0;
    let updatedCount = 0;
    let updateChangedProperties: PropertyValues | null = null;
    let updatedChangedProperties: PropertyValues | null = null;
    el.addController({
      onUpdate: (changedProperties: PropertyValues) => {
        updateChangedProperties = changedProperties;
        updateCount++;
      },
      onUpdated: (changedProperties: PropertyValues) => {
        updatedChangedProperties = changedProperties;
        updatedCount++;
      },
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

  test('controllers can be added multiple times', async () => {
    let connectedCount = 0;
    let disconnectedCount = 0;
    let updateCount = 0;
    let updatedCount = 0;
    const controller = {
      onConnected: () => {
        connectedCount++;
      },
      onDisconnected: () => {
        disconnectedCount++;
      },
      onUpdate: () => {
        updateCount++;
      },
      onUpdated: () => {
        updatedCount++;
      },
    };
    el.addController(controller);
    el.addController(controller);
    assert.equal(connectedCount, 2);
    container.removeChild(el);
    assert.equal(disconnectedCount, 2);
    container.appendChild(el);
    assert.equal(connectedCount, 4);
    el.foo = 'foo2';
    await el.updateComplete;
    assert.equal(updateCount, 2);
    assert.equal(updatedCount, 2);
    el.removeController(controller);
    el.foo = 'foo3';
    await el.updateComplete;
    assert.equal(updateCount, 2);
    assert.equal(updatedCount, 2);
  });

  test('controllers can be removed', async () => {
    let connectedCount = 0;
    let disconnectedCount = 0;
    let updateCount = 0;
    let updatedCount = 0;
    const controller = {
      onConnected: () => {
        connectedCount++;
      },
      onDisconnected: () => {
        disconnectedCount++;
      },
      onUpdate: () => {
        updateCount++;
      },
      onUpdated: () => {
        updatedCount++;
      },
    };
    el.addController(controller);
    assert.equal(connectedCount, 1);
    container.removeChild(el);
    assert.equal(disconnectedCount, 1);
    container.appendChild(el);
    assert.equal(connectedCount, 2);
    el.foo = 'foo2';
    await el.updateComplete;
    assert.equal(updateCount, 1);
    assert.equal(updatedCount, 1);
    el.removeController(controller);
    assert.equal(disconnectedCount, 2);
    container.removeChild(el);
    container.appendChild(el);
    el.foo = 'foo2';
    await el.updateComplete;
    assert.equal(disconnectedCount, 2);
    assert.equal(connectedCount, 2);
    assert.equal(updateCount, 1);
    assert.equal(updatedCount, 1);
  });

  test('controllers can can use host argument', async () => {
    let connectedHost;
    let disconnectedHost;
    let updateHost;
    let updatedHost;
    const controller = {
      onConnected: (host: ControllerHost) => {
        connectedHost = host;
      },
      onDisconnected: (host: ControllerHost) => {
        disconnectedHost = host;
      },
      onUpdate: (_changedProperties: PropertyValues, host: ControllerHost) => {
        updateHost = host;
      },
      onUpdated: (_changedProperties: PropertyValues, host: ControllerHost) => {
        updatedHost = host;
      },
    };
    el.addController(controller);
    container.removeChild(el);
    el.requestUpdate();
    await el.updateComplete;
    assert.equal(connectedHost, el);
    assert.equal(disconnectedHost, el);
    assert.equal(updateHost, el);
    assert.equal(updatedHost, el);
  });
});
