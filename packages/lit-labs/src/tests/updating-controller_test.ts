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

import {PropertyValues, UpdatingElement} from 'lit-element';
import {UpdatingController} from '../updating-controller.js';
import {generateElementName} from 'lit-element/src/test/test-helpers';
import {assert} from '@esm-bundle/chai';

// tslint:disable:no-any ok in tests

suite('UpdatingController', () => {
  let container: HTMLElement;

  class SimpleController extends UpdatingController {
    updateCount = 0;
    updatedCount = 0;
    connectedCount = 0;
    disconnectedCount = 0;
    updateChangedProperties: PropertyValues | null = null;
    updatedChangedProperties: PropertyValues | null = null;
    onConnected() {
      this.connectedCount++;
      super.onConnected();
    }
    onDisconnected() {
      this.disconnectedCount++;
      super.onDisconnected();
    }
    onUpdate(changedProperties: PropertyValues) {
      this.updateCount++;
      this.updateChangedProperties = changedProperties;
      super.onUpdate(changedProperties);
    }
    onUpdated(changedProperties: PropertyValues) {
      this.updatedCount++;
      this.updatedChangedProperties = changedProperties;
      super.onUpdated(changedProperties);
    }
  }

  class HostController extends SimpleController {
    nestedController = new SimpleController(this);
  }

  class A extends UpdatingElement {
    static properties = {foo: {}};
    foo = 'foo';
    updateCount = 0;
    updatedCount = 0;
    connectedCount = 0;
    disconnectedCount = 0;
    controller1 = new HostController(this);
    controller2 = new HostController(this);

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

  test('listens for element connected/disconnected', async () => {
    assert.equal(el.controller1.connectedCount, 1);
    assert.equal(el.controller2.connectedCount, 1);
    container.removeChild(el);
    assert.equal(el.controller1.disconnectedCount, 1);
    assert.equal(el.controller2.disconnectedCount, 1);
    container.appendChild(el);
    assert.equal(el.controller1.connectedCount, 2);
    assert.equal(el.controller2.connectedCount, 2);
  });

  test('listens for element update/updated', async () => {
    let expectedChangedProperties: PropertyValues = new Map([
      ['foo', undefined],
    ]);
    assert.equal(el.controller1.updateCount, 1);
    assert.deepEqual(
      el.controller1.updateChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller1.updatedCount, 1);
    assert.deepEqual(
      el.controller1.updatedChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller2.updateCount, 1);
    assert.deepEqual(
      el.controller2.updateChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller2.updatedCount, 1);
    assert.deepEqual(
      el.controller2.updatedChangedProperties,
      expectedChangedProperties
    );
    el.foo = 'foo2';
    await el.updateComplete;
    expectedChangedProperties = new Map([['foo', 'foo']]);
    assert.equal(el.controller1.updateCount, 2);
    assert.deepEqual(
      el.controller1.updateChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller1.updatedCount, 2);
    assert.deepEqual(
      el.controller1.updatedChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller2.updateCount, 2);
    assert.deepEqual(
      el.controller2.updateChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller2.updatedCount, 2);
    assert.deepEqual(
      el.controller2.updatedChangedProperties,
      expectedChangedProperties
    );
  });

  test('causes element to requestUpdate', async () => {
    assert.equal(el.updateCount, 1);
    assert.equal(el.updatedCount, 1);
    el.controller1.requestUpdate();
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
    assert.equal(el.updatedCount, 2);
    el.controller2.requestUpdate();
    await el.updateComplete;
    assert.equal(el.updateCount, 3);
    assert.equal(el.updatedCount, 3);
  });

  test('detaches/attaches from/to element', async () => {
    el.controller1.removeController(el.controller1);
    el.foo = 'foo2';
    await el.updateComplete;
    assert.equal(el.controller1.updateCount, 1);
    el.controller1.requestUpdate();
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
    assert.equal(el.controller1.updateCount, 1);
    el.controller1.addController(el, el, el.controller1);
    el.foo = 'foo3';
    await el.updateComplete;
    assert.equal(el.updateCount, 3);
    assert.equal(el.controller1.updateCount, 2);
    el.controller1.requestUpdate();
    await el.updateComplete;
    assert.equal(el.updateCount, 4);
    assert.equal(el.controller1.updateCount, 3);
  });

  test('nested controllers listen for connected/disconnected', async () => {
    assert.equal(el.controller1.connectedCount, 1);
    assert.equal(el.controller1.nestedController.connectedCount, 1);
    container.removeChild(el);
    assert.equal(el.controller1.disconnectedCount, 1);
    assert.equal(el.controller1.nestedController.disconnectedCount, 1);
    container.appendChild(el);
    assert.equal(el.controller1.connectedCount, 2);
    assert.equal(el.controller1.nestedController.connectedCount, 2);
  });

  test('nested controllers listen for update/updated', async () => {
    let expectedChangedProperties: PropertyValues = new Map([
      ['foo', undefined],
    ]);
    assert.equal(el.controller1.updateCount, 1);
    assert.deepEqual(
      el.controller1.updateChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller1.updatedCount, 1);
    assert.deepEqual(
      el.controller1.updatedChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller1.nestedController.updateCount, 1);
    assert.deepEqual(
      el.controller1.nestedController.updateChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller1.nestedController.updatedCount, 1);
    assert.deepEqual(
      el.controller1.nestedController.updatedChangedProperties,
      expectedChangedProperties
    );
    el.foo = 'foo2';
    await el.updateComplete;
    expectedChangedProperties = new Map([['foo', 'foo']]);
    assert.equal(el.controller1.updateCount, 2);
    assert.deepEqual(
      el.controller1.updateChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller1.updatedCount, 2);
    assert.deepEqual(
      el.controller1.updatedChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller1.nestedController.updateCount, 2);
    assert.deepEqual(
      el.controller1.nestedController.updateChangedProperties,
      expectedChangedProperties
    );
    assert.equal(el.controller1.nestedController.updatedCount, 2);
    assert.deepEqual(
      el.controller1.nestedController.updatedChangedProperties,
      expectedChangedProperties
    );
  });

  test('nested controllers cause element to requestUpdate', async () => {
    assert.equal(el.updateCount, 1);
    assert.equal(el.updatedCount, 1);
    el.controller1.nestedController.requestUpdate();
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
    assert.equal(el.updatedCount, 2);
    el.controller2.nestedController.requestUpdate();
    await el.updateComplete;
    assert.equal(el.updateCount, 3);
    assert.equal(el.updatedCount, 3);
  });

  test('nested controllers detach/attach', async () => {
    el.controller1.nestedController.removeController(
      el.controller1.nestedController
    );
    el.foo = 'foo2';
    await el.updateComplete;
    assert.equal(el.controller1.nestedController.updateCount, 1);
    el.controller1.nestedController.requestUpdate();
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
    assert.equal(el.controller1.nestedController.updateCount, 1);
    el.controller1.addController(
      el,
      el.controller1,
      el.controller1.nestedController
    );
    el.foo = 'foo3';
    await el.updateComplete;
    assert.equal(el.updateCount, 3);
    assert.equal(el.controller1.nestedController.updateCount, 2);
    el.controller1.nestedController.requestUpdate();
    await el.updateComplete;
    assert.equal(el.updateCount, 4);
    assert.equal(el.controller1.nestedController.updateCount, 3);
  });
});
