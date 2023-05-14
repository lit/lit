/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement, PropertyValues} from '@lit/reactive-element';
import {property} from '@lit/reactive-element/decorators/property.js';
import {generateElementName} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

suite('@property', () => {
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

  test('property options via decorator', async () => {
    const hasChanged = (value: any, old: any) =>
      old === undefined || value > old;
    const fromAttribute = (value: any) => parseInt(value);
    const toAttribute = (value: any) => `${value}-attr`;
    class E extends ReactiveElement {
      @property({attribute: false}) accessor noAttr = 'noAttr';
      @property({attribute: true}) accessor atTr = 'attr';
      @property({attribute: 'custom', reflect: true})
      accessor customAttr = 'customAttr';
      @property({hasChanged}) accessor hasChanged = 10;
      @property({converter: fromAttribute}) accessor fromAttribute = 1;
      @property({reflect: true, converter: {toAttribute}})
      accessor toAttribute = 1;
      @property({
        attribute: 'all-attr',
        hasChanged,
        converter: {fromAttribute, toAttribute},
        reflect: true,
      })
      accessor all = 10;

      updateCount = 0;

      override update(changed: PropertyValues) {
        this.updateCount++;
        super.update(changed);
      }
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.equal(el.updateCount, 1);
    assert.equal(el.noAttr, 'noAttr');
    assert.equal(el.atTr, 'attr');
    assert.equal(el.customAttr, 'customAttr');
    assert.equal(el.hasChanged, 10);
    assert.equal(el.fromAttribute, 1);
    assert.equal(el.toAttribute, 1);
    assert.equal(el.getAttribute('toattribute'), '1-attr');
    assert.equal(el.all, 10);
    assert.equal(el.getAttribute('all-attr'), '10-attr');
    el.setAttribute('noattr', 'noAttr2');
    el.setAttribute('attr', 'attr2');
    el.setAttribute('custom', 'customAttr2');
    el.setAttribute('fromattribute', '2attr');
    el.toAttribute = 2;
    el.all = 5;
    await el.updateComplete;
    assert.equal(el.updateCount, 2);
    assert.equal(el.noAttr, 'noAttr');
    assert.equal(el.atTr, 'attr2');
    assert.equal(el.customAttr, 'customAttr2');
    assert.equal(el.fromAttribute, 2);
    assert.equal(el.toAttribute, 2);
    assert.equal(el.getAttribute('toattribute'), '2-attr');
    assert.equal(el.all, 5);
    el.all = 15;
    await el.updateComplete;
    assert.equal(el.updateCount, 3);
    assert.equal(el.all, 15);
    assert.equal(el.getAttribute('all-attr'), '15-attr');
    el.setAttribute('all-attr', '16-attr');
    await el.updateComplete;
    assert.equal(el.updateCount, 4);
    assert.equal(el.getAttribute('all-attr'), '16-attr');
    assert.equal(el.all, 16);
    el.hasChanged = 5;
    await el.updateComplete;
    assert.equal(el.hasChanged, 5);
    assert.equal(el.updateCount, 4);
    el.hasChanged = 15;
    await el.updateComplete;
    assert.equal(el.hasChanged, 15);
    assert.equal(el.updateCount, 5);
    el.setAttribute('all-attr', '5-attr');
    await el.updateComplete;
    assert.equal(el.all, 5);
    assert.equal(el.updateCount, 5);
    el.all = 15;
    await el.updateComplete;
    assert.equal(el.all, 15);
    assert.equal(el.updateCount, 6);
  });

  test('can decorate user accessor with @property', async () => {
    class E extends ReactiveElement {
      _foo?: number;
      updatedContent?: number;

      get foo() {
        return this._foo as number;
      }

      @property({reflect: true, type: Number})
      set foo(v: number) {
        const old = this.foo;
        this._foo = v;
        this.requestUpdate('foo', old);
      }

      override updated() {
        this.updatedContent = this.foo;
      }
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.equal(el._foo, undefined);
    assert.equal(el.updatedContent, undefined);
    assert.isFalse(el.hasAttribute('foo'));
    el.foo = 5;
    await el.updateComplete;
    assert.equal(el._foo, 5);
    assert.equal(el.updatedContent, 5);
    assert.equal(el.getAttribute('foo'), '5');
  });

  test('property options via decorator do not modify superclass', async () => {
    class E extends ReactiveElement {
      @property({type: Number, reflect: true})
      accessor foo = 1;
    }
    customElements.define(generateElementName(), E);
    // Note, this forces `E` to finalize
    const el1 = new E();

    class F extends E {
      @property({type: Number})
      override accessor foo = 2;
    }

    customElements.define(generateElementName(), F);
    const el2 = new E();
    const el3 = new F();
    container.appendChild(el1);
    container.appendChild(el2);
    container.appendChild(el3);
    await el1.updateComplete;
    await el2.updateComplete;
    await el3.updateComplete;
    assert.isTrue(el1.hasAttribute('foo'));
    assert.isTrue(el2.hasAttribute('foo'));
    assert.isFalse(el3.hasAttribute('foo'));
  });

  test('can mix properties superclass with decorator on subclass', async () => {
    class E extends ReactiveElement {
      @property()
      accessor foo = 'foo';
    }

    class F extends E {
      @property()
      accessor bar = 'bar';
    }
    customElements.define(generateElementName(), F);
    const el = new F();
    container.appendChild(el);
    await el.updateComplete;
    el.setAttribute('foo', 'foo2');
    el.setAttribute('bar', 'bar2');
    await el.updateComplete;
    assert.equal(el.foo, 'foo2');
    assert.equal(el.bar, 'bar2');
  });
});
