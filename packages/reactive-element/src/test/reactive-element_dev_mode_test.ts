/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '../reactive-element.js';
import {generateElementName} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!ReactiveElement.enableWarning;

if (DEV_MODE) {
  suite('Developer mode warnings', () => {
    let container: HTMLElement;
    let warnings: string[] = [];

    const missingPlatformSupport =
      window.ShadyDOM?.inUse &&
      !(globalThis as any)['reactiveElementPlatformSupport'];

    const consoleWarn = console.warn;

    suiteSetup(() => {
      console.warn = (message: string) => warnings.push(message);
    });

    suiteTeardown(() => {
      console.warn = consoleWarn;
    });

    setup(() => {
      warnings = [];
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    teardown(() => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    // TODO(sorvell): To enable these, need to either configure the test
    // environment before loading any code or tweak the code to make the
    // console output detectable
    // under testing.
    suite.skip('Initial warnings', () => {
      test('warns for dev mode', async () => {
        assert.include(warnings[0], 'Do not use in production!');
      });

      (missingPlatformSupport ? test : test.skip)(
        'warns for missing polyfill-support',
        async () => {
          assert.include(warnings[1], 'polyfill-support');
        }
      );
    });

    test('warns when `initialize` is implemented', () => {
      class A extends ReactiveElement {
        initialize() {}
      }
      customElements.define(generateElementName(), A);
      new A();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'initialize');
    });

    test('warns on first instance only', () => {
      class A extends ReactiveElement {
        initialize() {}
      }
      customElements.define(generateElementName(), A);
      new A();
      new A();
      new A();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'initialize');
    });

    test('warns when `requestUpdateInternal` is implemented', () => {
      class A extends ReactiveElement {
        requestUpdateInternal() {}
      }
      customElements.define(generateElementName(), A);
      new A();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'requestUpdateInternal');
    });

    test('warns when updating properties are shadowed', async () => {
      class A extends ReactiveElement {
        static properties = {
          fooProp: {},
          barProp: {},
        };

        constructor() {
          super();
          // Simulates a class field.
          Object.defineProperty(this, 'fooProp', {
            value: 'foo',
            writable: false,
            enumerable: false,
            configurable: true,
          });
          Object.defineProperty(this, 'barProp', {
            value: 'bar',
            writable: false,
            enumerable: false,
            configurable: true,
          });
        }
      }
      customElements.define(generateElementName(), A);
      const a = new A();
      container.appendChild(a);
      await a.updateComplete;
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'fooProp, barProp');
      assert.include(warnings[0], 'class field');
    });

    test('warns when awaiting `requestUpdate`', async () => {
      class A extends ReactiveElement {}
      customElements.define(generateElementName(), A);
      const a = new A();
      container.appendChild(a);
      await a.requestUpdate();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'requestUpdate');
      assert.include(warnings[0], 'Promise');
    });

    suite('conditional warnings', () => {
      test('warns when `toAttribute` returns undefined with migration warnings on', async () => {
        class A extends ReactiveElement {
          static properties = {
            foo: {converter: {toAttribute: () => undefined}, reflect: true},
          };

          foo = 'hi';
        }
        A.enableWarning?.('migration');
        customElements.define(generateElementName(), A);
        const a = new A();
        container.appendChild(a);
        await a.updateComplete;
        assert.equal(warnings.length, 1);
        assert.include(warnings[0], 'undefined');
      });

      test('warns when update triggers another update if element', async () => {
        class A extends ReactiveElement {
          shouldUpdateAgain = false;
          updated() {
            if (this.shouldUpdateAgain) {
              this.shouldUpdateAgain = false;
              this.requestUpdate();
            }
          }
        }
        customElements.define(generateElementName(), A);
        const a = new A();
        container.appendChild(a);
        await a.updateComplete;
        assert.equal(warnings.length, 0);
        a.shouldUpdateAgain = true;
        a.requestUpdate();
        await a.updateComplete;
        assert.equal(warnings.length, 1);
        assert.include(warnings[0], 'update');
        assert.include(warnings[0], 'requested');
        warnings = [];
        a.requestUpdate();
        await a.updateComplete;
        assert.equal(warnings.length, 0);
        a.shouldUpdateAgain = true;
        A.disableWarning?.('change-in-update');
        a.requestUpdate();
        await a.updateComplete;
        assert.equal(warnings.length, 0);
      });

      test('warning settings can be set on base class and per class', async () => {
        class A extends ReactiveElement {
          shouldUpdateAgain = false;
          updated() {
            if (this.shouldUpdateAgain) {
              this.shouldUpdateAgain = false;
              this.requestUpdate();
            }
          }
        }
        customElements.define(generateElementName(), A);
        class B extends A {}
        customElements.define(generateElementName(), B);
        const a = new A();
        container.appendChild(a);
        const b = new B();
        container.appendChild(b);
        await a.updateComplete;
        await b.updateComplete;
        assert.equal(warnings.length, 0);
        const triggerChangeInUpdate = async () => {
          a.shouldUpdateAgain = true;
          b.shouldUpdateAgain = true;
          a.requestUpdate();
          b.requestUpdate();
          await a.updateComplete;
          await b.updateComplete;
        };
        // Defeat warning in base class
        A.disableWarning?.('change-in-update');
        await triggerChangeInUpdate();
        assert.equal(warnings.length, 0);
        // Explicitly turn on warning in subclass
        B.enableWarning?.('change-in-update');
        warnings = [];
        await triggerChangeInUpdate();
        assert.equal(warnings.length, 1);
        // Turn of warning in subclass and back on in base class
        B.disableWarning?.('change-in-update');
        A.enableWarning?.('change-in-update');
        warnings = [];
        await triggerChangeInUpdate();
        assert.equal(warnings.length, 1);
      });
    });
  });
}
