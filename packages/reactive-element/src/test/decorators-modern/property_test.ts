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

    let changedProperties: PropertyValues | undefined;

    class E extends ReactiveElement {
      @property({attribute: false})
      accessor noAttr = 'noAttr';

      @property({attribute: true})
      accessor atTr = 'attr';

      @property({attribute: 'custom', reflect: true})
      accessor customAttr = 'customAttr';

      @property({hasChanged})
      accessor hasChanged = 10;

      @property({converter: fromAttribute})
      accessor fromAttribute = 1;

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
        changedProperties = changed;
        super.update(changed);
      }
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.equal(el.updateCount, 1);
    assert.equal(el.noAttr, 'noAttr');
    assert.isTrue(changedProperties!.has('noAttr'));
    assert.equal(el.getAttribute('noAttr'), null);
    assert.equal(el.atTr, 'attr');
    assert.equal(el.getAttribute('attr'), null);
    assert.equal(el.customAttr, 'customAttr');
    // Make sure that the default value reflects
    assert.equal(el.getAttribute('custom'), 'customAttr');
    assert.equal(el.hasChanged, 10);
    assert.equal(el.fromAttribute, 1);
    assert.equal(el.toAttribute, 1);
    assert.equal(el.getAttribute('toattribute'), '1-attr');
    assert.equal(el.all, 10);
    assert.equal(el.getAttribute('all-attr'), '10-attr');

    // Test property->attribute reflection
    el.toAttribute = 27;
    el.all = 27;
    el.customAttr = '27';
    await el.updateComplete;
    assert.equal(el.getAttribute('toattribute'), '27-attr');
    assert.equal(el.getAttribute('all-attr'), '27-attr');
    assert.equal(el.getAttribute('custom'), '27');

    // Test attribute->property reflection
    el.setAttribute('noattr', 'noAttr2');
    el.setAttribute('attr', 'attr2');
    el.setAttribute('custom', 'customAttr2');
    el.setAttribute('fromattribute', '2attr');
    el.toAttribute = 2;
    el.all = 5;
    await el.updateComplete;
    assert.equal(el.updateCount, 3);
    assert.equal(el.noAttr, 'noAttr');
    assert.equal(el.atTr, 'attr2');
    assert.equal(el.customAttr, 'customAttr2');
    assert.equal(el.fromAttribute, 2);
    assert.equal(el.toAttribute, 2);
    assert.equal(el.getAttribute('toattribute'), '2-attr');
    assert.equal(el.all, 5);

    el.all = 15;
    await el.updateComplete;
    assert.equal(el.updateCount, 4);
    assert.equal(el.all, 15);
    assert.equal(el.getAttribute('all-attr'), '15-attr');

    el.setAttribute('all-attr', '16-attr');
    await el.updateComplete;
    assert.equal(el.updateCount, 5);
    assert.equal(el.getAttribute('all-attr'), '16-attr');
    assert.equal(el.all, 16);

    el.hasChanged = 5;
    await el.updateComplete;
    assert.equal(el.hasChanged, 5);
    assert.equal(el.updateCount, 5);

    el.hasChanged = 15;
    await el.updateComplete;
    assert.equal(el.hasChanged, 15);
    assert.equal(el.updateCount, 6);

    el.setAttribute('all-attr', '5-attr');
    await el.updateComplete;
    assert.equal(el.all, 5);
    assert.equal(el.updateCount, 6);

    el.all = 15;
    await el.updateComplete;
    assert.equal(el.all, 15);
    assert.equal(el.updateCount, 7);
  });

  test('can decorate user accessor with @property', async () => {
    class E extends ReactiveElement {
      updatedProperties?: PropertyValues<this>;

      _foo?: number;
      @property({reflect: true, type: Number})
      set foo(v: number) {
        this._foo = v;
      }

      get foo() {
        return this._foo as number;
      }

      override updated(changedProperties: PropertyValues<this>) {
        this.updatedProperties = changedProperties;
      }
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;

    // Check initial values
    assert.equal(el._foo, undefined);
    assert.isFalse(el.updatedProperties!.has('foo'));
    assert.isFalse(el.hasAttribute('foo'));

    // Setting values should reflect and populate changedProperties
    el.foo = 5;
    await el.updateComplete;

    assert.equal(el._foo, 5);
    assert.isTrue(el.updatedProperties!.has('foo'));
    assert.equal(el.updatedProperties!.get('foo'), undefined);
    assert.equal(el.getAttribute('foo'), '5');

    // Setting values again should populate changedProperties with old values
    el.foo = 7;
    await el.updateComplete;

    assert.equal(el._foo, 7);
    assert.equal(el.updatedProperties!.get('foo'), 5);
    assert.equal(el.getAttribute('foo'), '7');
  });

  test('can mix property options via decorator and via getter', async () => {
    const hasChanged = (value: any, old: any) =>
      old === undefined || value > old;
    const fromAttribute = (value: any) => parseInt(value);
    const toAttribute = (value: any) => `${value}-attr`;
    class E extends ReactiveElement {
      @property({hasChanged})
      accessor hasChanged = 10;

      @property({converter: fromAttribute})
      accessor fromAttribute = 1;

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

      static override get properties() {
        return {
          noAttr: {attribute: false},
          atTr: {attribute: true},
          customAttr: {attribute: 'custom', reflect: true},
        };
      }

      declare noAttr: string | undefined;
      declare atTr: string | undefined;
      declare customAttr: string | undefined;

      constructor() {
        super();
        this.noAttr = 'noAttr';
        this.atTr = 'attr';
        this.customAttr = 'customAttr';
      }

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

  // This test isn't valid. You can not override a field that's initialized
  // with an accessor that uses private storage, because the base class's
  // initializer will run before the subclass's private storage is setup.
  test('property options via decorator do not modify superclass', async () => {
    class E extends ReactiveElement {
      static override get properties() {
        return {foo: {type: Number, reflect: true}};
      }
      // @ts-expect-error 'accessor' modifier cannot be used with 'declare' modifier.
      declare accessor foo: number;
    }
    const eTagName = generateElementName();
    console.log("E's tag name", eTagName);
    customElements.define(eTagName, E);
    // Note, this forces `E` to finalize
    const el1 = new E();

    class F extends E {
      @property({type: Number})
      override accessor foo: number = 2;
    }

    const fTagName = generateElementName();
    console.log("F's tag name", fTagName);
    customElements.define(fTagName, F);

    const el2 = new E();
    const el3 = new F();
    container.appendChild(el1);
    container.appendChild(el2);
    container.appendChild(el3);
    el1.foo = 1;
    el2.foo = 2;
    el3.foo = 3;
    await el1.updateComplete;
    await el2.updateComplete;
    await el3.updateComplete;
    assert.equal(el1.getAttribute('foo'), '1');
    assert.equal(el2.getAttribute('foo'), '2');
    assert.isFalse(el3.hasAttribute('foo'));
  });

  test('can mix properties superclass with decorator on subclass', async () => {
    class E extends ReactiveElement {
      static override get properties() {
        return {
          foo: {},
        };
      }

      declare foo: string;

      constructor() {
        super();
        // Avoiding class fields for Babel compat.
        this.foo = 'foo';
      }
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

  // This is a duplicate of the same-named test in react-element_test.ts,
  // copied here so that we ensure that this step is performed if the code
  // that does this is removed from ReactiveElement and moved to the decorator
  test('properties set before upgrade are applied', async () => {
    let changedProperties: PropertyValues<E> | undefined = undefined;

    class E extends ReactiveElement {
      @property() accessor foo = '';
      @property() accessor bar = true;
      @property() accessor zug: unknown = null;

      override update(properties: PropertyValues<this>) {
        super.update(properties);
        changedProperties = properties;
      }
    }

    const name = generateElementName();
    const el = document.createElement(name) as E;
    container.appendChild(el);

    // Set properties before the element is defined
    const objectValue = {};
    el.foo = 'hi';
    el.bar = false;
    el.zug = objectValue;

    customElements.define(name, E);
    await el.updateComplete;

    // Properties should have the pre-upgraded values
    assert.equal(el.foo, 'hi');
    assert.equal(el.bar, false);
    assert.equal(el.zug, objectValue);
    assert.isTrue(changedProperties!.has('foo'));

    // Check that the element is still reactive
    changedProperties = undefined;
    el.foo = 'bye';
    await el.updateComplete;
    assert.isTrue(changedProperties!.has('foo'));
  });

  test('property options compose when subclassing', async () => {
    const hasChanged = (value: any, old: any) =>
      old === undefined || value > old;
    const fromAttribute = (value: any) => parseInt(value);
    const toAttribute = (value: any) => `${value}-attr`;
    class E extends ReactiveElement {
      @property({attribute: false})
      accessor noAttr = 'noAttr';
      @property({attribute: true})
      accessor atTr = 'attr';
      @property()
      accessor customAttr = 'customAttr';
      @property()
      accessor hasChanged = 10;

      updateCount = 0;

      override update(changed: PropertyValues) {
        this.updateCount++;
        super.update(changed);
      }
    }
    customElements.define(generateElementName(), E);

    class F extends E {
      @property({attribute: 'custom', reflect: true})
      override accessor customAttr = 'customAttr';
      @property({hasChanged})
      override accessor hasChanged = 10;
      @property()
      accessor fromAttribute = 1;
      @property()
      accessor toAttribute = 1;
      accessor all = 10;
    }

    class G extends F {
      @property({converter: fromAttribute})
      override accessor fromAttribute = 1;
      @property({reflect: true, converter: {toAttribute}})
      override accessor toAttribute = 1;
      @property({
        attribute: 'all-attr',
        hasChanged,
        converter: {fromAttribute, toAttribute},
        reflect: true,
      })
      override accessor all = 10;
    }

    customElements.define(generateElementName(), G);

    const el = new G();
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

  test('superclass properties not affected by subclass', async () => {
    class E extends ReactiveElement {
      @property({attribute: 'zug', reflect: true})
      accessor foo = 5;
      @property({reflect: true})
      accessor bar = 'bar';
    }
    customElements.define(generateElementName(), E);

    class F extends E {
      @property({attribute: false})
      override accessor foo = 6;
      override accessor bar = 'subbar';

      @property()
      accessor nug = 5;
    }
    customElements.define(generateElementName(), F);

    const el = new E();
    const sub = new F();
    container.appendChild(el);
    await el.updateComplete;
    container.appendChild(sub);
    await sub.updateComplete;

    assert.equal(el.foo, 5);
    assert.equal(el.getAttribute('zug'), '5');
    assert.isFalse(el.hasAttribute('foo'));
    assert.equal(el.bar, 'bar');
    assert.equal(el.getAttribute('bar'), 'bar');
    assert.isUndefined((el as any).nug);

    assert.equal(sub.foo, 6);
    assert.isFalse(sub.hasAttribute('zug'));
    assert.isFalse(sub.hasAttribute('foo'));
    assert.equal(sub.bar, 'subbar');
    assert.equal(sub.getAttribute('bar'), 'subbar');
    assert.equal(sub.nug, 5);
  });

  test(`subclass contains super classes' reactive properties`, async () => {
    class Base extends ReactiveElement {
      @property() accessor first = 'first';
    }

    class SubClass extends Base {
      @property() accessor second = 'second';
    }

    const elName = generateElementName();
    customElements.define(elName, SubClass);
    container.innerHTML = `<${elName} first="overrideFirst" second="overrideSecond"></${elName}>`;

    // Check initialization
    const el: SubClass = container.querySelector(elName)!;
    assert.equal(el.first, 'overrideFirst');
    assert.equal(el.second, 'overrideSecond');

    // Property can be set from attribute
    el.setAttribute('first', 'first updated');
    el.setAttribute('second', 'second updated');

    await el.updateComplete;

    assert.equal(el.first, 'first updated');
    assert.equal(el.second, 'second updated');
  });
});
