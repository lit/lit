/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '../../reactive-element.js';
import {generateElementName} from '../test-helpers.js';
import {
  decorateProperty,
  ReactiveElementConstructor,
} from '../../decorators/base.js';
import {assert} from '@esm-bundle/chai';
import {property} from '../../decorators/property.js';

suite('Decorators using intitializers', () => {
  let container: HTMLDivElement;

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    container.parentElement!.removeChild(container);
  });

  test('can create initializer decorator with `decorateProperty`', async () => {
    const setProp = (value: string) =>
      decorateProperty(
        (ctor: ReactiveElementConstructor, name: PropertyKey) => {
          ctor.addInitializer((e: A) => {
            (e as any)[name as string] = value;
          });
        }
      );

    class A extends ReactiveElement {
      @setProp('foo')
      foo?: string;
    }
    customElements.define(generateElementName(), A);
    const el = new A();
    container.appendChild(el);
    assert.equal(el.foo, 'foo');
  });

  test('can create `listen` controller decorator', async () => {
    const listeners: WeakMap<
      ReactiveElement,
      Array<{type: string; listener: (e: Event) => void}>
    > = new WeakMap();
    const listenWindow = <T>(type: string) => {
      return decorateProperty(
        (ctor: ReactiveElementConstructor, name: PropertyKey) => {
          ctor.addInitializer((e: ReactiveElement) => {
            const listener = (event: Event) =>
              ((((ctor.prototype as unknown) as T)[
                name as keyof T
              ] as unknown) as Function).call(e, event);
            let l = listeners.get(e);
            if (l === undefined) {
              listeners.set(e, (l = []));
              e.addController({
                hostConnected() {
                  l!.forEach((info) => {
                    window.addEventListener(info.type, info.listener);
                  });
                },
                hostDisconnected() {
                  l!.forEach((info) => {
                    window.removeEventListener(info.type, info.listener);
                  });
                },
              });
            }
            l.push({type, listener});
          });
        }
      );
    };

    class B extends ReactiveElement {
      @listenWindow<B>('nug')
      eventHandler1(e: Event) {
        this.event1 = e.type;
      }
      @listenWindow<B>('zug')
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
    type Validator = (v: any) => any;

    const validators: WeakMap<
      ReactiveElement,
      Array<{key: PropertyKey; validator: Validator}>
    > = new WeakMap();

    const validate = <T>(validatorFn: Validator) => {
      return decorateProperty(
        (ctor: ReactiveElementConstructor, name: PropertyKey) => {
          ctor.addInitializer((e: ReactiveElement) => {
            let v = validators.get(e);
            if (v === undefined) {
              validators.set(e, (v = []));
              e.addController({
                hostUpdate() {
                  v!.forEach(({key, validator}) => {
                    ((e as unknown) as T)[key as keyof T] = validator(
                      ((e as unknown) as T)[key as keyof T]
                    );
                  });
                },
              });
            }
            v.push({key: name, validator: validatorFn});
          });
        }
      );
    };

    class B extends ReactiveElement {
      @validate<B>((v: number) => Math.max(0, Math.min(10, v)))
      @property()
      foo = 5;
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
    type Observer = (v: any, key?: PropertyKey) => void;

    const observers: WeakMap<
      ReactiveElement,
      Array<{key: PropertyKey; observer: Observer}>
    > = new WeakMap();

    const observer = <T>(observerFn: Observer) => {
      return decorateProperty(
        (ctor: ReactiveElementConstructor, name: PropertyKey) => {
          ctor.addInitializer((e: ReactiveElement) => {
            let v = observers.get(e);
            if (v === undefined) {
              observers.set(e, (v = []));
              e.addController({
                hostUpdated() {
                  v!.forEach(({key, observer}) => {
                    observer.call(
                      e,
                      ((e as unknown) as T)[key as keyof T],
                      key
                    );
                  });
                },
              });
            }
            v.push({key: name, observer: observerFn});
          });
        }
      );
    };

    class B extends ReactiveElement {
      @observer<B>(function (this: B, v: number) {
        this._observedFoo = v;
      })
      @property()
      foo = 5;
      _observedFoo?: number;

      @observer<B>(function (this: B, v: string) {
        this._observedBar = v;
      })
      @property()
      bar = 'bar';
      _observedBar?: string;
    }
    customElements.define(generateElementName(), B);
    const el = new B();
    container.appendChild(el);
    await el.updateComplete;
    assert.equal(el._observedFoo, 5);
    assert.equal(el._observedBar, 'bar');
    el.foo = 100;
    el.bar = 'bar2';
    await el.updateComplete;
    assert.equal(el._observedFoo, 100);
    assert.equal(el._observedBar, 'bar2');
  });
});
