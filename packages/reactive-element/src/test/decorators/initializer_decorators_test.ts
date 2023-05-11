/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '@lit/reactive-element';
import {generateElementName} from '../test-helpers.js';
// import {decorateProperty} from '@lit/reactive-element/decorators/base.js';
import {assert} from '@esm-bundle/chai';
import {property} from '@lit/reactive-element/decorators/property.js';

suite('Decorators using initializers', () => {
  let container: HTMLDivElement;

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    container.parentElement!.removeChild(container);
  });

  test('can create initializer decorator with `decorateProperty`', async () => {
    function wasDecorated(value: string) {
      return <C extends A, V>(
        _target: V,
        {name, addInitializer}: ClassFieldDecoratorContext<C, V>
      ) => {
        addInitializer(function (this: C) {
          this.decoration = {name, value};
        });
      };
    }

    class A extends ReactiveElement {
      @wasDecorated('bar')
      foo?: string;

      decoration?: {name: PropertyKey; value: string};
    }
    customElements.define(generateElementName(), A);
    const el = new A();
    container.appendChild(el);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.deepEqual((el as any).decoration, {name: 'foo', value: 'bar'});
  });

  test('can create `listen` controller decorator', async () => {
    // A decorator that adds a controller that listens to a window event.
    const listenWindow =
      (type: string) =>
      <
        C extends ReactiveElement,
        V extends <E extends Event>(this: C, event: E) => any
      >(
        target: V,
        {addInitializer}: ClassMethodDecoratorContext<C, V>
      ) => {
        addInitializer(function (this: C) {
          const listener = (event: Event) => target.call(this, event);
          this.addController({
            hostConnected() {
              window.addEventListener(type, listener);
            },
            hostDisconnected() {
              window.removeEventListener(type, listener);
            },
          });
        });
      };

    class B extends ReactiveElement {
      @listenWindow('nug')
      eventHandler1(e: Event) {
        this.event1 = e.type;
      }
      @listenWindow('zug')
      eventHandler2(e: Event) {
        this.event2 = e.type;
      }
      event1?: string;
      event2?: string;
    }
    customElements.define(generateElementName(), B);
    const el = new B();
    container.appendChild(el);
    document.body.dispatchEvent(new Event('nug', {bubbles: true}));
    document.body.dispatchEvent(new Event('zug', {bubbles: true}));
    assert.equal(el.event1, 'nug');
    assert.equal(el.event2, 'zug');
    el.event1 = undefined;
    el.event2 = undefined;
    container.removeChild(el);
    document.body.dispatchEvent(new Event('nug', {bubbles: true}));
    document.body.dispatchEvent(new Event('zug', {bubbles: true}));
    assert.isUndefined(el.event1);
    assert.isUndefined(el.event2);
  });

  test('can create `validate` controller decorator', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type Validator<T> = (v: T) => T;

    const validate =
      <T>(validatorFn: Validator<T>) =>
      <C extends ReactiveElement, V extends T>(
        _target: ClassAccessorDecoratorTarget<C, V>,
        {
          access: {get, set},
          addInitializer,
        }: ClassAccessorDecoratorContext<C, V>
      ) => {
        addInitializer(function (this: C) {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const host = this;
          this.addController({
            hostUpdate() {
              set(host, validatorFn(get(host)) as V);
            },
          });
        });
      };

    class B extends ReactiveElement {
      @property()
      @validate((v: number) => Math.max(0, Math.min(10, v)))
      accessor foo = 5;
    }
    customElements.define(generateElementName(), B);
    const el = new B();
    container.appendChild(el);
    await el.updateComplete;
    assert.equal(el.foo, 5);
    el.foo = 100;
    await el.updateComplete;
    assert.equal(el.foo, 10);
    el.foo = -100;
    await el.updateComplete;
    assert.equal(el.foo, 0);
  });

  test('can create `observer` controller decorator', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type Observer<T> = (value: T, previous?: T) => void;

    const observer = <T>(observerFn: Observer<T>) => {
      return <C extends ReactiveElement, V extends T>(
        _target: ClassAccessorDecoratorTarget<C, V>,
        {
          access: {get},
          name,
          addInitializer,
        }: ClassAccessorDecoratorContext<C, V>
      ) => {
        addInitializer(function (this: C) {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const host = this;
          let previousValue = get(host);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hasChanged =
            (this.constructor as any).getPropertyOptions(name)?.hasChanged ??
            Object.is;
          this.addController({
            hostUpdated() {
              const value = get(host);
              if (hasChanged(value, previousValue)) {
                observerFn.call(host, value, previousValue);
                previousValue = value;
              }
            },
          });
        });
      };
    };

    class B extends ReactiveElement {
      @property()
      @observer(function (this: B, value: number, previous?: number) {
        this._observedFoo = {value, previous};
      })
      accessor foo = 5;
      _observedFoo?: {value: number; previous?: number};

      @property()
      @observer(function (this: B, value: string, previous?: string) {
        this._observedBar = {value, previous};
      })
      accessor bar = 'bar';
      _observedBar?: {value: string; previous?: string};
    }
    customElements.define(generateElementName(), B);
    const el = new B();
    container.appendChild(el);
    await el.updateComplete;
    assert.deepEqual(el._observedFoo, {value: 5, previous: undefined});
    assert.deepEqual(el._observedBar, {value: 'bar', previous: undefined});
    el.foo = 100;
    el.bar = 'bar2';
    await el.updateComplete;
    assert.deepEqual(el._observedFoo, {value: 100, previous: 5});
    assert.deepEqual(el._observedBar, {value: 'bar2', previous: 'bar'});
  });
});
