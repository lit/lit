/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  PropertyValues,
  ReactiveElement,
  ReactiveController,
} from '../reactive-element.js';
import {generateElementName} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

suite('Reactive controllers', () => {
  class MyController implements ReactiveController {
    host: ReactiveElement;
    updateCount = 0;
    updatedCount = 0;
    connectedCount = 0;
    disconnectedCount = 0;
    callbackOrder: string[] = [];

    constructor(host: ReactiveElement) {
      this.host = host;
      this.host.addController(this);
    }

    hostConnected() {
      this.connectedCount++;
      this.callbackOrder.push('hostConnected');
    }

    hostDisconnected() {
      this.disconnectedCount++;
      this.callbackOrder.push('hostDisconnected');
    }

    hostUpdate() {
      this.updateCount++;
      this.callbackOrder.push('hostUpdate');
    }

    hostUpdated() {
      this.updatedCount++;
      this.callbackOrder.push('hostUpdated');
    }
  }

  class A extends ReactiveElement {
    static properties = {foo: {}};
    foo = 'foo';
    updateCount = 0;
    updatedCount = 0;
    connectedCount = 0;
    disconnectedCount = 0;

    controller = new MyController(this);

    connectedCallback() {
      this.connectedCount++;
      super.connectedCallback();
      this.controller.callbackOrder.push('connectedCallback');
    }

    disconnectedCallback() {
      this.disconnectedCount++;
      super.disconnectedCallback();
      this.controller.callbackOrder.push('disconnectedCallback');
    }

    update(changedProperties: PropertyValues) {
      this.updateCount++;
      super.update(changedProperties);
      this.controller.callbackOrder.push('update');
    }

    firstUpdated() {
      this.controller.callbackOrder.push('firstUpdated');
    }

    updated() {
      this.updatedCount++;
      this.controller.callbackOrder.push('updated');
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

  test('controllers can implement hostConnected/hostDisconnected', () => {
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

  test('controllers added after an element is connected call `hostConnected`', () => {
    const controller = new MyController(el);
    el.addController(controller);
    assert.equal(el.controller.connectedCount, 1);
    assert.equal(el.controller.disconnectedCount, 0);
    container.removeChild(el);
    assert.equal(el.controller.disconnectedCount, 1);
    container.appendChild(el);
    assert.equal(el.controller.connectedCount, 2);
    assert.equal(el.controller.disconnectedCount, 1);
  });

  test('controllers can implement hostUpdate/hostUpdated', async () => {
    assert.equal(el.updateCount, 1);
    assert.equal(el.updatedCount, 1);
    assert.equal(el.controller.updateCount, 1);
    assert.equal(el.controller.updatedCount, 1);
    el.foo = 'new';
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
    assert.equal(el.updatedCount, 2);
    assert.equal(el.controller.updateCount, 2);
    assert.equal(el.controller.updatedCount, 2);
  });

  test('controllers can be removed', async () => {
    assert.equal(el.controller.connectedCount, 1);
    assert.equal(el.controller.disconnectedCount, 0);
    assert.equal(el.controller.updateCount, 1);
    assert.equal(el.controller.updatedCount, 1);
    el.removeController(el.controller);
    el.foo = 'new';
    await el.updateComplete;
    el.remove();
    assert.equal(el.controller.connectedCount, 1);
    assert.equal(el.controller.disconnectedCount, 0);
    assert.equal(el.controller.updateCount, 1);
    assert.equal(el.controller.updatedCount, 1);
  });

  test('controllers callback order', async () => {
    assert.deepEqual(el.controller.callbackOrder, [
      'hostConnected',
      'connectedCallback',
      'hostUpdate',
      'update',
      'hostUpdated',
      'firstUpdated',
      'updated',
    ]);
    el.controller.callbackOrder = [];
    el.foo = 'new';
    await el.updateComplete;
    assert.deepEqual(el.controller.callbackOrder, [
      'hostUpdate',
      'update',
      'hostUpdated',
      'updated',
    ]);
    el.controller.callbackOrder = [];
    container.removeChild(el);
    assert.deepEqual(el.controller.callbackOrder, [
      'hostDisconnected',
      'disconnectedCallback',
    ]);
  });
});
