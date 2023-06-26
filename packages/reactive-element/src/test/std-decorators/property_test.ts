/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement, PropertyValues} from '@lit/reactive-element';
import {property} from '@lit/reactive-element/std-decorators/property.js';
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
        super.update(changed);
      }
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.equal(el.updateCount, 1);
    assert.equal(el.noAttr, 'noAttr');
    assert.equal(el.getAttribute('noAttr'), null);
    assert.equal(el.atTr, 'attr');
    assert.equal(el.getAttribute('attr'), null);
    assert.equal(el.customAttr, 'customAttr');
    assert.equal(el.getAttribute('customAttr'), null);
    assert.equal(el.hasChanged, 10);
    assert.equal(el.fromAttribute, 1);
    assert.equal(el.toAttribute, 1);
    assert.equal(el.getAttribute('toattribute'), null);
    assert.equal(el.all, 10);
    assert.equal(el.getAttribute('all-attr'), null);

    // Test reflection
    el.toAttribute = 27;
    el.all = 27;
    await el.updateComplete;
    assert.equal(el.getAttribute('toattribute'), '27-attr');
    assert.equal(el.getAttribute('all-attr'), '27-attr');

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
      _foo?: number;
      updatedContent?: number;

      @property({reflect: true, type: Number})
      set foo(v: number) {
        const old = this.foo;
        this._foo = v;
        this.requestUpdate('foo', old);
      }

      get foo() {
        return this._foo as number;
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
    assert.equal(el.getAttribute('toattribute'), null);
    assert.equal(el.all, 10);
    assert.equal(el.getAttribute('all-attr'), null);
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
  // with an accessor that uses private storage, becase the base class's
  // initializer will run before the subclass's private storage is setup.
  // test.only('property options via decorator do not modify superclass', async () => {
  //   class E extends ReactiveElement {
  //     static override get properties() {
  //       return {foo: {type: Number, reflect: true}};
  //     }

  //     // accessor foo: number;

  //     constructor() {
  //       super();
  //       // Avoiding class fields for Babel compat.
  //       // (this as any).foo = 1;
  //     }
  //   }
  //   const eTagName = generateElementName();
  //   console.log('E\'s tag name', eTagName);
  //   customElements.define(eTagName, E);
  //   // Note, this forces `E` to finalize
  //   const el1 = new E();

  //   class F extends E {
  //     @property({type: Number})
  //     accessor foo = 2;

  //     constructor() {
  //       console.log('F constructor');
  //       super();
  //     }
  //   }

  //   const fTagName = generateElementName();
  //   console.log('F\'s tag name', fTagName);
  //   customElements.define(fTagName, F);

  //   const el2 = new E();
  //   const el3 = new F();
  //   container.appendChild(el1);
  //   container.appendChild(el2);
  //   container.appendChild(el3);
  //   await el1.updateComplete;
  //   await el2.updateComplete;
  //   await el3.updateComplete;
  //   assert.isTrue(el1.hasAttribute('foo'));
  //   assert.isTrue(el2.hasAttribute('foo'));
  //   assert.isFalse(el3.hasAttribute('foo'));
  // });

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

  // We can not support custom property descriptors anymore. This use case
  // will need to be handled by custom decorators that handle new property
  // options directly.
  // test('can customize property options', async () => {
  //   interface MyPropertyDeclaration<TypeHint = unknown>
  //     extends PropertyDeclaration {
  //     validator?: (value: any) => TypeHint;
  //     observer?: (oldValue: TypeHint) => void;
  //   }

  //   interface MyPropertyDeclarations {
  //     readonly [key: string]: PropertyDeclaration | MyPropertyDeclaration;
  //   }

  //   const myProperty = (options: MyPropertyDeclaration) => property(options);

  //   class E extends ReactiveElement {
  //     static override getPropertyDescriptor(
  //       name: PropertyKey,
  //       key: string | symbol,
  //       options: MyPropertyDeclaration
  //     ) {
  //       const defaultDescriptor = super.getPropertyDescriptor(
  //         name,
  //         key,
  //         options
  //       )!;
  //       return {
  //         get: defaultDescriptor.get,
  //         set(this: E, value: unknown) {
  //           const oldValue = (this as unknown as {[key: string]: unknown})[
  //             name as string
  //           ];
  //           if (options.validator) {
  //             value = options.validator(value);
  //           }
  //           (this as unknown as {[key: string]: unknown})[key as string] =
  //             value;
  //           (this as unknown as ReactiveElement).requestUpdate(name, oldValue);
  //         },

  //         configurable: defaultDescriptor.configurable,
  //         enumerable: defaultDescriptor.enumerable,
  //       };
  //     }

  //     override updated(changedProperties: PropertyValues) {
  //       super.updated(changedProperties);
  //       changedProperties.forEach((value: unknown, key: PropertyKey) => {
  //         const options = (
  //           this.constructor as typeof ReactiveElement
  //         ).getPropertyOptions(key) as MyPropertyDeclaration;
  //         const observer = options.observer;
  //         if (typeof observer === 'function') {
  //           observer.call(this, value);
  //         }
  //       });
  //     }

  //     // provide custom decorator expecting extended type
  //     @myProperty({
  //       type: Number,
  //       validator: (value: number) => Math.min(10, Math.max(value, 0)),
  //     })
  //     accessor foo = 5;

  //     @property({})
  //     accessor bar = 'bar';

  //     _observedZot?: any;

  //     _observedZot2?: any;

  //     // use regular decorator and cast to type
  //     @property({
  //       observer: function (this: E, oldValue: string) {
  //         this._observedZot = {value: this.zot, oldValue};
  //       },
  //     } as PropertyDeclaration)
  //     accessor zot = '';

  //     declare zot2: string;
  //     declare foo2: number;

  //     constructor() {
  //       super();
  //       // Avoiding class fields for Babel compat.
  //       this.zot2 = '';
  //       this.foo2 = 5;
  //     }

  //     // custom typed properties
  //     static override get properties(): MyPropertyDeclarations {
  //       return {
  //         // object cast as type
  //         zot2: {
  //           observer: function (this: E, oldValue: string) {
  //             this._observedZot2 = {value: this.zot2, oldValue};
  //           },
  //         } as PropertyDeclaration,
  //         // object satisfying defined custom type.
  //         foo2: {
  //           type: Number,
  //           validator: (value: number) => Math.min(10, Math.max(value, 0)),
  //         },
  //       };
  //     }
  //   }
  //   customElements.define(generateElementName(), E);

  //   const el = new E();
  //   container.appendChild(el);
  //   await el.updateComplete;
  //   el.foo = 20;
  //   el.foo2 = 20;
  //   assert.equal(el.foo, 10);
  //   assert.equal(el.foo2, 10);
  //   assert.deepEqual(el._observedZot, {value: '', oldValue: undefined});
  //   assert.deepEqual(el._observedZot2, {value: '', oldValue: undefined});
  //   el.foo = -5;
  //   el.foo2 = -5;
  //   assert.equal(el.foo, 0);
  //   assert.equal(el.foo2, 0);
  //   el.bar = 'bar2';
  //   assert.equal(el.bar, 'bar2');
  //   el.zot = 'zot';
  //   el.zot2 = 'zot';
  //   await el.updateComplete;
  //   assert.deepEqual(el._observedZot, {value: 'zot', oldValue: ''});
  //   assert.deepEqual(el._observedZot2, {value: 'zot', oldValue: ''});
  // });
});
