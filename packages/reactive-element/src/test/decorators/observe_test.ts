/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '../../reactive-element.js';
import {property} from '../../decorators/property.js';
import {computed} from '../../decorators/computed.js';
import {observe} from '../../decorators/observe.js';
import {generateElementName} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

suite('@observe', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container !== undefined) {
      container.parentElement!.removeChild(container);
      (container as any) = undefined;
    }
  });

  test('can observe value', async () => {
    class E extends ReactiveElement {
      observeInfo1 = {};
      observeInfo2 = {};

      @property()
      @observe(function (
        this: E,
        value: number,
        old: number | undefined,
        name: PropertyKey
      ) {
        this.observeInfo1 = {value, old, name};
      })
      prop1?: number;

      @property()
      @observe(function (
        this: E,
        value: number,
        old: number | undefined,
        name: PropertyKey
      ) {
        this.observeInfo2 = {value, old, name};
      })
      prop2 = 'hi';
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.deepEqual(el.observeInfo1, {});
    assert.deepEqual(el.observeInfo2, {
      value: 'hi',
      old: undefined,
      name: 'prop2',
    });
    el.observeInfo1 = el.observeInfo2 = {};
    el.prop1 = 1;
    await el.updateComplete;
    assert.deepEqual(el.observeInfo1, {
      value: 1,
      old: undefined,
      name: 'prop1',
    });
    assert.deepEqual(el.observeInfo2, {});
    el.observeInfo1 = el.observeInfo2 = {};
    el.prop1 = 2;
    el.prop2 = 'yo';
    await el.updateComplete;
    assert.deepEqual(el.observeInfo1, {value: 2, old: 1, name: 'prop1'});
    assert.deepEqual(el.observeInfo2, {value: 'yo', old: 'hi', name: 'prop2'});
    el.observeInfo1 = el.observeInfo2 = {};
    el.requestUpdate();
    await el.updateComplete;
    assert.deepEqual(el.observeInfo1, {});
    assert.deepEqual(el.observeInfo2, {});
  });

  test('can use hasChanged', async () => {
    class E extends ReactiveElement {
      observeInfo = {};
      @property({
        hasChanged: (v: number, p?: number) => p === undefined || v > p,
      })
      @observe(function (
        this: E,
        value: number,
        old: number | undefined,
        name: PropertyKey
      ) {
        this.observeInfo = {value, old, name};
      })
      prop = 1;
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.deepEqual(el.observeInfo, {value: 1, old: undefined, name: 'prop'});
    el.observeInfo = {};
    el.prop = 5;
    await el.updateComplete;
    assert.deepEqual(el.observeInfo, {value: 5, old: 1, name: 'prop'});
    el.prop = 4;
    el.observeInfo = {};
    await el.updateComplete;
    assert.deepEqual(el.observeInfo, {});
    // Should not provoke an update, but force update to verify custom
    // hasChanged handling is working.
    el.requestUpdate();
    await el.updateComplete;
    assert.deepEqual(el.observeInfo, {});
    el.prop = 5;
    el.observeInfo = {};
    await el.updateComplete;
    assert.deepEqual(el.observeInfo, {value: 5, old: 4, name: 'prop'});
  });

  test('can observe computed property', async () => {
    class E extends ReactiveElement {
      observeInfo = {};
      @property({
        hasChanged: (v: number, p?: number) => p === undefined || v > p,
      })
      @computed((d1: number, d2: number) => d1 + d2, ['d1', 'd2'])
      @observe(function (
        this: E,
        value: number,
        old: number | undefined,
        name: PropertyKey
      ) {
        this.observeInfo = {value, old, name};
      })
      prop?: number;

      @property()
      d1 = 1;

      @property()
      d2 = 2;
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.deepEqual(el.observeInfo, {value: 3, old: undefined, name: 'prop'});
    el.observeInfo = {};
    el.d1 = 10;
    await el.updateComplete;
    assert.deepEqual(el.observeInfo, {value: 12, old: 3, name: 'prop'});
  });
});
