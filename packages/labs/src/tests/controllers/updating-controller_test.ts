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
import {property} from 'updating-element/decorators/property.js';
import {
  UpdatingController,
  PropertyDeclarations,
} from '../../controllers/updating-controller.js';
import {generateElementName} from '../test-helpers';
import {assert} from '@esm-bundle/chai';

// tslint:disable:no-any ok in tests

suite('UpdatingController', () => {
  let container: HTMLElement;

  class SimpleController extends UpdatingController {
    connectedCount = 0;
    disconnectedCount = 0;
    willUpdateCount = 0;
    updateCount = 0;
    didUpdateCount = 0;
    willUpdateChangedProperties: PropertyValues | null = null;
    updateChangedProperties: PropertyValues | null = null;
    didUpdateChangedProperties: PropertyValues | null = null;

    static properties: PropertyDeclarations = {foo: {}};

    foo = 'foo';

    @property()
    bar = 'bar';

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
    didUpdate(changedProperties: PropertyValues) {
      this.didUpdateCount++;
      this.didUpdateChangedProperties = changedProperties;
    }
  }

  class HostController extends SimpleController {
    static properties: PropertyDeclarations = {
      count: {type: Number},
    };

    count = 0;

    @property()
    prop = 'prop';

    nestedController = new SimpleController(this.host);
  }

  class A extends UpdatingElement {
    static properties = {foo: {}};
    foo = 'foo';
    willUpdateCount = 0;
    updateCount = 0;
    didUpdateCount = 0;
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

    willUpdate(changedProperties: PropertyValues) {
      this.willUpdateCount++;
      super.willUpdate(changedProperties);
    }

    update(changedProperties: PropertyValues) {
      this.updateCount++;
      super.update(changedProperties);
    }

    didUpdate(changedProperties: PropertyValues) {
      this.didUpdateCount++;
      super.didUpdate(changedProperties);
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

  test('host is set', async () => {
    assert.equal(el.controller1.host, el);
  });

  test('calls connectedCallback/disconnectedCallback', async () => {
    assert.equal(el.controller1.connectedCount, 1);
    assert.equal(el.controller2.connectedCount, 1);
    container.removeChild(el);
    assert.equal(el.controller1.disconnectedCount, 1);
    assert.equal(el.controller2.disconnectedCount, 1);
    container.appendChild(el);
    assert.equal(el.controller1.connectedCount, 2);
    assert.equal(el.controller2.connectedCount, 2);
  });

  test('calls willUpdate/update/didUpdate and tracks properties', async () => {
    let expectedChangedProperties1: PropertyValues = new Map([
      ['foo', undefined],
      ['bar', undefined],
      ['count', undefined],
      ['prop', undefined],
    ]);
    let expectedChangedProperties2 = expectedChangedProperties1;
    assert.equal(el.controller1.willUpdateCount, 1);
    assert.deepEqual(
      el.controller1.willUpdateChangedProperties,
      expectedChangedProperties1
    );
    assert.equal(el.controller1.updateCount, 1);
    assert.deepEqual(
      el.controller1.updateChangedProperties,
      expectedChangedProperties1
    );
    assert.equal(el.controller1.didUpdateCount, 1);
    assert.deepEqual(
      el.controller1.didUpdateChangedProperties,
      expectedChangedProperties1
    );
    assert.equal(el.controller2.willUpdateCount, 1);
    assert.deepEqual(
      el.controller2.willUpdateChangedProperties,
      expectedChangedProperties2
    );
    assert.equal(el.controller2.updateCount, 1);
    assert.deepEqual(
      el.controller2.updateChangedProperties,
      expectedChangedProperties2
    );
    assert.equal(el.controller2.didUpdateCount, 1);
    assert.deepEqual(
      el.controller2.didUpdateChangedProperties,
      expectedChangedProperties2
    );
    el.controller1.foo = 'foo2';
    el.controller1.prop = 'prop1.2';
    el.controller1.count++;
    el.controller2.count = 5;
    el.controller2.prop = 'prop2.2';
    await el.updateComplete;
    expectedChangedProperties1 = new Map([
      ['foo', 'foo'],
      ['count', 0],
      ['prop', 'prop'],
    ] as Array<[string, number | string]>);
    expectedChangedProperties2 = new Map([
      ['count', 0],
      ['prop', 'prop'],
    ] as Array<[string, number | string]>);
    assert.equal(el.controller1.willUpdateCount, 2);
    assert.deepEqual(
      el.controller1.willUpdateChangedProperties,
      expectedChangedProperties1
    );
    assert.equal(el.controller1.updateCount, 2);
    assert.deepEqual(
      el.controller1.updateChangedProperties,
      expectedChangedProperties1
    );
    assert.equal(el.controller1.didUpdateCount, 2);
    assert.deepEqual(
      el.controller1.didUpdateChangedProperties,
      expectedChangedProperties1
    );
    assert.equal(el.controller2.willUpdateCount, 2);
    assert.deepEqual(
      el.controller2.willUpdateChangedProperties,
      expectedChangedProperties2
    );
    assert.equal(el.controller2.updateCount, 2);
    assert.deepEqual(
      el.controller2.updateChangedProperties,
      expectedChangedProperties2
    );
    assert.equal(el.controller2.didUpdateCount, 2);
    assert.deepEqual(
      el.controller2.didUpdateChangedProperties,
      expectedChangedProperties2
    );
  });

  test('requestUpdate causes element to requestUpdate', async () => {
    assert.equal(el.updateCount, 1);
    assert.equal(el.didUpdateCount, 1);
    el.controller1.requestUpdate();
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
    assert.equal(el.didUpdateCount, 2);
    el.controller2.requestUpdate();
    await el.updateComplete;
    assert.equal(el.updateCount, 3);
    assert.equal(el.didUpdateCount, 3);
  });

  suite('nested controllers', () => {
    test('host is set', async () => {
      assert.equal(el.controller1.nestedController.host, el);
    });

    test('calls connectedCallback/disconnectedCallback', async () => {
      assert.equal(el.controller1.connectedCount, 1);
      assert.equal(el.controller1.nestedController.connectedCount, 1);
      container.removeChild(el);
      assert.equal(el.controller1.disconnectedCount, 1);
      assert.equal(el.controller1.nestedController.disconnectedCount, 1);
      container.appendChild(el);
      assert.equal(el.controller1.connectedCount, 2);
      assert.equal(el.controller1.nestedController.connectedCount, 2);
    });

    test('calls willUpdate/update/didUpdate', async () => {
      let expectedChangedProperties: PropertyValues = new Map([
        ['foo', undefined],
        ['bar', undefined],
      ]);
      assert.equal(el.controller1.nestedController.willUpdateCount, 1);
      assert.deepEqual(
        el.controller1.nestedController.willUpdateChangedProperties,
        expectedChangedProperties
      );
      assert.equal(el.controller1.nestedController.updateCount, 1);
      assert.deepEqual(
        el.controller1.nestedController.updateChangedProperties,
        expectedChangedProperties
      );
      assert.equal(el.controller1.nestedController.didUpdateCount, 1);
      assert.deepEqual(
        el.controller1.nestedController.didUpdateChangedProperties,
        expectedChangedProperties
      );
      el.controller1.nestedController.foo = 'foo2';
      await el.updateComplete;
      expectedChangedProperties = new Map([['foo', 'foo']] as Array<
        [string, number | string]
      >);
      assert.equal(el.controller1.nestedController.willUpdateCount, 2);
      assert.deepEqual(
        el.controller1.nestedController.willUpdateChangedProperties,
        expectedChangedProperties
      );
      assert.equal(el.controller1.nestedController.updateCount, 2);
      assert.deepEqual(
        el.controller1.nestedController.updateChangedProperties,
        expectedChangedProperties
      );
      assert.equal(el.controller1.nestedController.didUpdateCount, 2);
      assert.deepEqual(
        el.controller1.nestedController.didUpdateChangedProperties,
        expectedChangedProperties
      );
      el.controller1.nestedController.bar = 'bar2';
      await el.updateComplete;
      expectedChangedProperties = new Map([['bar', 'bar']] as Array<
        [string, number | string]
      >);
      assert.equal(el.controller1.nestedController.willUpdateCount, 3);
      assert.deepEqual(
        el.controller1.nestedController.willUpdateChangedProperties,
        expectedChangedProperties
      );
      assert.equal(el.controller1.nestedController.updateCount, 3);
      assert.deepEqual(
        el.controller1.nestedController.updateChangedProperties,
        expectedChangedProperties
      );
      assert.equal(el.controller1.nestedController.didUpdateCount, 3);
      assert.deepEqual(
        el.controller1.nestedController.didUpdateChangedProperties,
        expectedChangedProperties
      );
    });

    test('requestUpdate causes element to requestUpdate', async () => {
      assert.equal(el.updateCount, 1);
      assert.equal(el.didUpdateCount, 1);
      el.controller1.nestedController.requestUpdate();
      await el.updateComplete;
      assert.equal(el.updateCount, 2);
      assert.equal(el.didUpdateCount, 2);
      el.controller2.nestedController.requestUpdate();
      await el.updateComplete;
      assert.equal(el.updateCount, 3);
      assert.equal(el.didUpdateCount, 3);
    });
  });
});
