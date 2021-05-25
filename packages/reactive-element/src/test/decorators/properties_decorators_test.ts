/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {decorateProperty} from '../../decorators/base.js';
import {query} from '../../decorators/query.js';
import {property} from '../../decorators/property.js';
import {state} from '../../decorators/state.js';
import {ReactiveElement, PropertyValues} from '../../reactive-element.js';
import {
  generateElementName,
  canTestReactiveElement,
  RenderingElement,
  html,
} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

suite('decorators in static properties', () => {
  let container: HTMLElement;

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    document.body.removeChild(container);
  });

  type WithDecorations<T = ReactiveElement> = T & {
    decorations?: {name: PropertyKey; value: string}[];
  };

  const wasDecorated = (value: string) =>
    decorateProperty({
      finisher: (ctor: typeof ReactiveElement, name: PropertyKey) => {
        ctor.addInitializer((e: ReactiveElement) => {
          (e as WithDecorations).decorations ??= [];
          (e as WithDecorations).decorations!.push({name, value});
        });
      },
    });

  test('can apply decorator to reactive property', async () => {
    let changedSnapshot: PropertyValues;
    class A extends ReactiveElement {
      static get properties() {
        return {
          foo: {decorators: [wasDecorated('a'), wasDecorated('b')]},
          bar: {decorators: [wasDecorated('c'), wasDecorated('d')]},
        };
      }

      declare foo: string;
      declare bar: string;

      updated(changed: PropertyValues) {
        changedSnapshot = new Map(changed);
      }
    }
    customElements.define(generateElementName(), A);
    const el = new A() as WithDecorations<A>;
    container.appendChild(el);
    await el.updateComplete;
    assert.deepEqual(changedSnapshot!, new Map());
    assert.deepEqual(el.decorations, [
      {name: 'foo', value: 'a'},
      {name: 'foo', value: 'b'},
      {name: 'bar', value: 'c'},
      {name: 'bar', value: 'd'},
    ]);
    el.foo = 'test';
    el.bar = 'test2';
    await el.updateComplete;
    assert.deepEqual(
      changedSnapshot!,
      new Map([
        ['foo', undefined],
        ['bar', undefined],
      ])
    );
  });

  test('can apply decorators to non-reactive property', async () => {
    class A extends ReactiveElement {
      static get properties() {
        return {
          method: {
            reactive: false,
            decorators: [wasDecorated('a'), wasDecorated('b')],
          },
        };
      }
      called = 0;
      method() {
        this.called++;
      }
    }
    customElements.define(generateElementName(), A);
    const el = new A() as WithDecorations<A>;
    container.appendChild(el);
    await el.updateComplete;
    assert.deepEqual(el.decorations, [
      {name: 'method', value: 'a'},
      {name: 'method', value: 'b'},
    ]);
    el.method();
    el.method();
    assert.equal(el.called, 2);
  });

  (canTestReactiveElement ? test : test.skip)(
    'can apply query decorator',
    async () => {
      class A extends RenderingElement {
        static get properties() {
          return {
            div: {reactive: false, decorators: [query('#blah')]},
          };
        }

        declare div: HTMLDivElement;

        render() {
          return html` <div id="blah">This one</div> `;
        }
      }
      customElements.define(generateElementName(), A);
      const el = new A();
      container.appendChild(el);
      await el.updateComplete;
      assert.equal(el.div, el.shadowRoot!.firstElementChild as HTMLDivElement);
    }
  );

  test('can compose decorators via subclassing', async () => {
    class A extends ReactiveElement {
      static get properties() {
        return {
          foo: {
            decorators: [wasDecorated('a')],
          },
          method: {
            reactive: false,
            decorators: [wasDecorated('m1'), wasDecorated('m2')],
          },
        };
      }
      called = 0;
      method() {
        this.called++;
      }
    }
    customElements.define(generateElementName(), A);
    class B extends A {
      static get properties() {
        return {
          foo: {
            decorators: [wasDecorated('b')],
          },
          bar: {decorators: [wasDecorated('c'), wasDecorated('d')]},
          method: {
            reactive: false,
            decorators: [wasDecorated('m3')],
          },
          method2: {
            reactive: false,
            decorators: [wasDecorated('m4'), wasDecorated('m5')],
          },
        };
      }
      called2 = 0;
      method2() {
        this.called2++;
      }
    }
    customElements.define(generateElementName(), B);
    const el1 = new A() as WithDecorations<A>;
    container.appendChild(el1);
    await el1.updateComplete;
    assert.deepEqual(el1.decorations, [
      {name: 'foo', value: 'a'},
      {name: 'method', value: 'm1'},
      {name: 'method', value: 'm2'},
    ]);
    const el2 = new B() as WithDecorations<B>;
    container.appendChild(el2);
    assert.deepEqual(el2.decorations, [
      {name: 'foo', value: 'a'},
      {name: 'method', value: 'm1'},
      {name: 'method', value: 'm2'},
      {name: 'foo', value: 'b'},
      {name: 'bar', value: 'c'},
      {name: 'bar', value: 'd'},
      {name: 'method', value: 'm3'},
      {name: 'method2', value: 'm4'},
      {name: 'method2', value: 'm5'},
    ]);
  });

  test('can apply property decorator', async () => {
    const hasChanged = (a: number, b: number) => b === undefined || a > b;
    class A extends ReactiveElement {
      static get properties() {
        return {
          foo: {
            hasChanged,
            decorators: [property({reflect: true})],
          },
        };
      }

      declare foo: number;

      constructor() {
        super();
        this.foo = 1;
      }
    }
    customElements.define(generateElementName(), A);
    const el = new A() as WithDecorations<A>;
    container.appendChild(el);
    await el.updateComplete;
    assert.equal(el.getAttribute('foo'), '1');
    el.foo = -1;
    await el.updateComplete;
    assert.equal(el.getAttribute('foo'), '1');
  });

  test('can apply state decorator', async () => {
    const hasChanged = (a: number, b: number) => b === undefined || a > b;
    class A extends ReactiveElement {
      static get properties() {
        return {
          foo: {
            hasChanged,
            decorators: [state()],
          },
        };
      }

      declare foo: number;

      constructor() {
        super();
        this.foo = 1;
      }

      didUpdate = false;

      updated() {
        this.didUpdate = true;
      }
    }
    customElements.define(generateElementName(), A);
    const el = new A() as WithDecorations<A>;
    container.appendChild(el);
    await el.updateComplete;
    assert.isTrue(el.didUpdate);
    assert.isFalse(el.hasAttribute('foo'));
    el.didUpdate = false;
    el.foo = -1;
    await el.updateComplete;
    assert.isFalse(el.didUpdate);
  });
});
