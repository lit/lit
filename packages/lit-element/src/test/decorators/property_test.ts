/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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
  html,
  LitElement,
  UpdatingElement,
  PropertyValues,
  PropertyDeclaration,
} from '../../lit-element.js';
import {property} from '../../lib/decorators/property.js';
import {canTestLitElement, generateElementName} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

(canTestLitElement ? suite : suite.skip)('@property', () => {
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
    class E extends LitElement {
      @property({attribute: false}) noAttr = 'noAttr';
      @property({attribute: true}) atTr = 'attr';
      @property({attribute: 'custom', reflect: true})
      customAttr = 'customAttr';
      @property({hasChanged}) hasChanged = 10;
      @property({converter: fromAttribute}) fromAttribute = 1;
      @property({reflect: true, converter: {toAttribute}})
      toAttribute = 1;
      @property({
        attribute: 'all-attr',
        hasChanged,
        converter: {fromAttribute, toAttribute},
        reflect: true,
      })
      all = 10;

      updateCount = 0;

      update(changed: PropertyValues) {
        this.updateCount++;
        super.update(changed);
      }

      render() {
        return html``;
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
    class E extends LitElement {
      _foo?: number;
      updatedContent?: number;

      @property({reflect: true, type: Number})
      get foo() {
        return this._foo as number;
      }

      set foo(v: number) {
        const old = this.foo;
        this._foo = v;
        this.requestUpdate('foo', old);
      }

      updated() {
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
    class E extends LitElement {
      @property({hasChanged}) hasChanged = 10;
      @property({converter: fromAttribute}) fromAttribute = 1;
      @property({reflect: true, converter: {toAttribute}})
      toAttribute = 1;
      @property({
        attribute: 'all-attr',
        hasChanged,
        converter: {fromAttribute, toAttribute},
        reflect: true,
      })
      all = 10;

      updateCount = 0;

      static get properties() {
        return {
          noAttr: {attribute: false},
          atTr: {attribute: true},
          customAttr: {attribute: 'custom', reflect: true},
        };
      }

      noAttr: string | undefined;
      atTr: string | undefined;
      customAttr: string | undefined;

      constructor() {
        super();
        this.noAttr = 'noAttr';
        this.atTr = 'attr';
        this.customAttr = 'customAttr';
      }

      update(changed: PropertyValues) {
        this.updateCount++;
        super.update(changed);
      }

      render() {
        return html``;
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

  test('property options via decorator do not modify superclass', async () => {
    class E extends UpdatingElement {
      static get properties() {
        return {foo: {type: Number, reflect: true}};
      }

      foo = 1;
    }
    customElements.define(generateElementName(), E);
    // Note, this forces `E` to finalize
    const el1 = new E();

    class F extends E {
      @property({type: Number}) foo = 2;
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
    class E extends UpdatingElement {
      static get properties() {
        return {
          foo: {},
        };
      }

      foo: string;

      constructor() {
        super();
        this.foo = 'foo';
      }
    }

    class F extends E {
      @property() bar = 'bar';
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

  test('can customize property options', async () => {
    interface MyPropertyDeclaration<TypeHint = unknown>
      extends PropertyDeclaration {
      validator?: (value: any) => TypeHint;
      observer?: (oldValue: TypeHint) => void;
    }

    interface MyPropertyDeclarations {
      readonly [key: string]: PropertyDeclaration | MyPropertyDeclaration;
    }

    const myProperty = (options: MyPropertyDeclaration) => property(options);

    class E extends UpdatingElement {
      static getPropertyDescriptor(
        name: PropertyKey,
        key: string | symbol,
        options: MyPropertyDeclaration
      ) {
        const defaultDescriptor = super.getPropertyDescriptor(
          name,
          key,
          options
        );
        return {
          get: defaultDescriptor.get,
          set(this: E, value: unknown) {
            const oldValue = ((this as unknown) as {[key: string]: unknown})[
              name as string
            ];
            if (options.validator) {
              value = options.validator(value);
            }
            ((this as unknown) as {[key: string]: unknown})[
              key as string
            ] = value;
            ((this as unknown) as UpdatingElement).requestUpdate(
              name,
              oldValue
            );
          },

          configurable: defaultDescriptor.configurable,
          enumerable: defaultDescriptor.enumerable,
        };
      }

      updated(changedProperties: PropertyValues) {
        super.updated(changedProperties);
        changedProperties.forEach((value: unknown, key: PropertyKey) => {
          const options = (this
            .constructor as typeof UpdatingElement).getPropertyOptions(
            key
          ) as MyPropertyDeclaration;
          const observer = options.observer;
          if (typeof observer === 'function') {
            observer.call(this, value);
          }
        });
      }

      // provide custom deorator expecting extended type
      @myProperty({
        type: Number,
        validator: (value: number) => Math.min(10, Math.max(value, 0)),
      })
      foo = 5;

      @property({}) bar = 'bar';

      _observedZot?: any;

      _observedZot2?: any;

      // use regular decorator and cast to type
      @property({
        observer: function (this: E, oldValue: string) {
          this._observedZot = {value: this.zot, oldValue};
        },
      } as PropertyDeclaration)
      zot = '';

      zot2 = '';

      foo2 = 5;

      // custom typed properties
      static get properties(): MyPropertyDeclarations {
        return {
          // object cast as type
          zot2: {
            observer: function (this: E, oldValue: string) {
              this._observedZot2 = {value: this.zot2, oldValue};
            },
          } as PropertyDeclaration,
          // object satisfying defined custom type.
          foo2: {
            type: Number,
            validator: (value: number) => Math.min(10, Math.max(value, 0)),
          },
        };
      }
    }
    customElements.define(generateElementName(), E);

    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    el.foo = 20;
    el.foo2 = 20;
    assert.equal(el.foo, 10);
    assert.equal(el.foo2, 10);
    assert.deepEqual(el._observedZot, {value: '', oldValue: undefined});
    assert.deepEqual(el._observedZot2, {value: '', oldValue: undefined});
    el.foo = -5;
    el.foo2 = -5;
    assert.equal(el.foo, 0);
    assert.equal(el.foo2, 0);
    el.bar = 'bar2';
    assert.equal(el.bar, 'bar2');
    el.zot = 'zot';
    el.zot2 = 'zot';
    await el.updateComplete;
    assert.deepEqual(el._observedZot, {value: 'zot', oldValue: ''});
    assert.deepEqual(el._observedZot2, {value: 'zot', oldValue: ''});
  });
});
