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

suite('UpdatingController', () => {
  let container: HTMLElement;

  class StatusService {
    status: Map<number, boolean> = new Map();
    callbacks: Map<number, Set<(status: boolean) => void>> = new Map();
    subscribe(id: number, callback: (status: boolean) => void) {
      let set = this.callbacks.get(id);
      if (set === undefined) {
        this.callbacks.set(id, (set = new Set()));
      }
      set.add(callback);
      callback(this.status.get(id) ?? false);
    }

    unsubscribe(id: number, callback: (status: boolean) => void) {
      this.callbacks.get(id)?.delete(callback);
    }

    setStatus(id: number, status: boolean) {
      const set = this.callbacks.get(id);
      this.status.set(id, status);
      if (set !== undefined) {
        set.forEach((cb) => cb(status));
      }
    }
  }

  const service = new StatusService();

  class ResourceStatusController extends UpdatingController {
    @property()
    id?: number;

    wasDisconnected = false;

    @property()
    status = false;

    handleStatus = (status: boolean) => {
      this.status = status;
    };

    handleChanges(changedProperties: PropertyValues) {
      const oldId = changedProperties.get('id');
      if (this.id !== oldId) {
        if (oldId !== undefined) {
          service.unsubscribe(oldId as number, this.handleStatus);
        }
        service.subscribe(this.id!, this.handleStatus);
      }
    }

    connectedCallback() {
      if (this.wasDisconnected && this.id !== undefined) {
        service.subscribe(this.id!, this.handleStatus);
      }
    }

    disconnectedCallback() {
      this.wasDisconnected = true;
      if (this.id !== undefined) {
        service.unsubscribe(this.id!, this.handleStatus);
      }
    }
  }

  class NameController extends UpdatingController {
    @property()
    first = '';
    @property()
    last = '';

    _fullName = '';
    handleChanges(changedProperties: PropertyValues) {
      if (changedProperties.has('first') || changedProperties.has('last')) {
        this._fullName = `${this.first} ${this.last}`;
      }
      return {fullName: this._fullName};
    }
  }

  class SimpleController extends UpdatingController {
    connectedCount = 0;
    disconnectedCount = 0;
    willUpdateCount = 0;
    updateCount = 0;
    updatedCount = 0;
    computeChangedProperties: PropertyValues | null = null;

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
    willUpdate() {
      this.willUpdateCount++;
    }
    update() {
      this.updateCount++;
      super.update();
    }
    updated() {
      this.updatedCount++;
    }

    handleChanges(changedProperties: PropertyValues) {
      this.computeChangedProperties = changedProperties;
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
    bar = 'bar';
    @property()
    resourceId = 0;
    @property()
    resourceStatus = false;
    willUpdateCount = 0;
    updateCount = 0;
    updatedCount = 0;
    connectedCount = 0;
    disconnectedCount = 0;
    nameController = new NameController(this);
    statusController = new ResourceStatusController(this);
    controller1 = new HostController(this);
    controller2 = new HostController(this);

    nameControllerFullName = '';

    connectedCallback() {
      this.connectedCount++;
      super.connectedCallback();
    }

    disconnectedCallback() {
      this.disconnectedCount++;
      super.disconnectedCallback();
    }

    willUpdate() {
      this.willUpdateCount++;
      this.statusController.id = this.resourceId;
    }

    update(changedProperties: PropertyValues) {
      this.updateCount++;
      const {fullName} = this.nameController.takeChanges(() => {
        this.nameController.first = this.foo;
        this.nameController.last = this.bar;
      });
      super.update(changedProperties);
      this.nameControllerFullName = fullName;
      this.resourceStatus = this.statusController.status;
    }

    updated() {
      this.updatedCount++;
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

  test('calls willUpdate/update/updated and tracks properties', async () => {
    let expectedChangedProperties1: PropertyValues = new Map([
      ['foo', undefined],
      ['bar', undefined],
      ['count', undefined],
      ['prop', undefined],
    ]);
    let expectedChangedProperties2 = expectedChangedProperties1;
    assert.equal(el.controller1.willUpdateCount, 1);
    assert.equal(el.controller1.updateCount, 1);
    assert.equal(el.controller1.updatedCount, 1);
    assert.deepEqual(
      el.controller1.computeChangedProperties,
      expectedChangedProperties1
    );
    assert.equal(el.controller2.willUpdateCount, 1);
    assert.equal(el.controller2.updateCount, 1);
    assert.equal(el.controller2.updatedCount, 1);
    assert.deepEqual(
      el.controller2.computeChangedProperties,
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
    assert.equal(el.controller1.updateCount, 2);
    assert.equal(el.controller1.updatedCount, 2);
    assert.deepEqual(
      el.controller1.computeChangedProperties,
      expectedChangedProperties1
    );
    assert.equal(el.controller2.willUpdateCount, 2);
    assert.equal(el.controller2.updateCount, 2);
    assert.equal(el.controller2.updatedCount, 2);
    assert.deepEqual(
      el.controller2.computeChangedProperties,
      expectedChangedProperties2
    );
  });

  test('requestUpdate causes element to requestUpdate', async () => {
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

  test('can use properties computed in controller', async () => {
    assert.equal(el.nameControllerFullName, 'foo bar');
    el.foo = 'foo2';
    el.bar = 'bar2';
    await el.updateComplete;
    assert.equal(el.nameControllerFullName, 'foo2 bar2');
  });

  test('can trigger updates based on controller using service', async () => {
    // initially false
    assert.equal(el.resourceStatus, false);
    // responds to status change
    service.setStatus(0, true);
    await el.updateComplete;
    assert.equal(el.resourceStatus, true);
    // responds to resourceId change
    el.resourceId = 5;
    await el.updateComplete;
    assert.equal(el.resourceStatus, false);
    // responds to status change on new resourceId
    service.setStatus(5, true);
    await el.updateComplete;
    assert.equal(el.resourceStatus, true);
    // does not respond to status change on old resourceId
    service.setStatus(0, false);
    await el.updateComplete;
    assert.equal(el.resourceStatus, true);
    container.removeChild(el);
    // does not respond to status change while disconnected
    service.setStatus(5, false);
    await el.updateComplete;
    assert.equal(el.resourceStatus, true);
    // updates status change when connected
    container.appendChild(el);
    await el.updateComplete;
    assert.equal(el.resourceStatus, false);
    // responds to status change after re-connected
    service.setStatus(5, true);
    await el.updateComplete;
    assert.equal(el.resourceStatus, true);
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

    test('calls willUpdate/update/updated and tracks properties', async () => {
      let expectedChangedProperties: PropertyValues = new Map([
        ['foo', undefined],
        ['bar', undefined],
      ]);
      assert.equal(el.controller1.nestedController.willUpdateCount, 1);
      assert.equal(el.controller1.nestedController.updateCount, 1);
      assert.equal(el.controller1.nestedController.updatedCount, 1);
      assert.deepEqual(
        el.controller1.nestedController.computeChangedProperties,
        expectedChangedProperties
      );
      el.controller1.nestedController.foo = 'foo2';
      await el.updateComplete;
      expectedChangedProperties = new Map([['foo', 'foo']] as Array<
        [string, number | string]
      >);
      assert.equal(el.controller1.nestedController.willUpdateCount, 2);
      assert.equal(el.controller1.nestedController.updateCount, 2);
      assert.equal(el.controller1.nestedController.updatedCount, 2);
      assert.deepEqual(
        el.controller1.nestedController.computeChangedProperties,
        expectedChangedProperties
      );
      el.controller1.nestedController.bar = 'bar2';
      await el.updateComplete;
      expectedChangedProperties = new Map([['bar', 'bar']] as Array<
        [string, number | string]
      >);
      assert.equal(el.controller1.nestedController.willUpdateCount, 3);
      assert.equal(el.controller1.nestedController.updateCount, 3);
      assert.equal(el.controller1.nestedController.updatedCount, 3);
      assert.deepEqual(
        el.controller1.nestedController.computeChangedProperties,
        expectedChangedProperties
      );
    });

    test('requestUpdate causes element to requestUpdate', async () => {
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
  });
});
