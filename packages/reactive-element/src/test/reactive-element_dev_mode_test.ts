/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '@lit/reactive-element';
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
      !globalThis[`reactiveElementPolyfillSupport${DEV_MODE ? `DevMode` : ``}`];

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

    const litWarnings = globalThis.litIssuedWarnings!;

    suite('Initial warnings', () => {
      test('warns for dev mode', () => {
        assert.isTrue(
          Array.from(litWarnings).some((v) => v?.includes('Lit is in dev mode'))
        );
      });

      (missingPlatformSupport ? test : test.skip)(
        'warns for missing polyfill-support',
        () => {
          assert.isTrue(
            Array.from(litWarnings).some((v) => v?.includes('polyfill-support'))
          );
        }
      );
    });

    suite('shadowed reactive properties', () => {
      test('throws when reactive properties defined by the current class are shadowed by class fields', async () => {
        class ShadowedProps extends ReactiveElement {
          static override properties = {
            fooProp: {},
            barProp: {},
          };

          constructor() {
            super();
            // Simulates a class field.
            Object.defineProperty(this, 'fooProp', {
              value: 'foo',
              writable: true,
              enumerable: true,
              configurable: true,
            });
            Object.defineProperty(this, 'barProp', {
              value: 'bar',
              writable: true,
              enumerable: true,
              configurable: true,
            });
          }
        }
        customElements.define(generateElementName(), ShadowedProps);
        const a = new ShadowedProps();
        container.appendChild(a);
        let message = '';
        try {
          await a.updateComplete;
        } catch (e) {
          message = (e as Error).message;
        }
        assert.include(message, 'class fields');
        assert.include(message, 'fooProp');
        assert.include(message, 'barProp');
        // always throws
        const b = new ShadowedProps();
        container.appendChild(b);
        message = '';
        try {
          await b.updateComplete;
        } catch (e) {
          message = (e as Error).message;
        }
        assert.include(message, 'class fields');
        assert.include(message, 'fooProp');
        assert.include(message, 'barProp');
      });

      test('throws when reactive properties defined by an ancestor class are shadowed by class fields', async () => {
        class AncestorWithProps extends ReactiveElement {
          static override properties = {
            fooProp: {},
            barProp: {},
          };
        }

        class ShadowedProps extends AncestorWithProps {
          constructor() {
            super();
            // Simulates a class field.
            Object.defineProperty(this, 'fooProp', {
              value: 'foo',
              writable: true,
              enumerable: true,
              configurable: true,
            });
            Object.defineProperty(this, 'barProp', {
              value: 'bar',
              writable: true,
              enumerable: true,
              configurable: true,
            });
          }
        }
        customElements.define(generateElementName(), ShadowedProps);
        const a = new ShadowedProps();
        container.appendChild(a);
        let message = '';
        try {
          await a.updateComplete;
        } catch (e) {
          message = (e as Error).message;
        }
        assert.include(message, 'class fields');
        assert.include(message, 'fooProp');
        assert.include(message, 'barProp');
        // always throws
        const b = new ShadowedProps();
        container.appendChild(b);
        message = '';
        try {
          await b.updateComplete;
        } catch (e) {
          message = (e as Error).message;
        }
        assert.include(message, 'class fields');
        assert.include(message, 'fooProp');
        assert.include(message, 'barProp');
      });

      test('does not throw if the property has `noAccessor` set', async () => {
        class ShadowedProps extends ReactiveElement {
          static override properties = {
            prop: {noAccessor: true},
          };

          constructor() {
            super();
            // Simulates a class field.
            Object.defineProperty(this, 'prop', {
              value: 123,
              writable: true,
              enumerable: true,
              configurable: true,
            });
          }
        }
        customElements.define(generateElementName(), ShadowedProps);

        const el = new ShadowedProps();
        container.appendChild(el);

        el.requestUpdate();
        await el.updateComplete;
      });

      test('does not throw if no descriptor is created for the property', async () => {
        class SomeElement extends ReactiveElement {
          static override properties = {
            prop: {},
          };

          static override getPropertyDescriptor(..._args: Array<any>) {
            // Don't create any reactive properties.
            return undefined;
          }

          constructor() {
            super();
            // Simulates a class field.
            Object.defineProperty(this, 'prop', {
              value: 123,
              writable: true,
              enumerable: true,
              configurable: true,
            });
          }
        }
        customElements.define(generateElementName(), SomeElement);

        const el = new SomeElement();
        container.appendChild(el);

        el.requestUpdate();
        await el.updateComplete;
      });
    });

    suite('conditional warnings', () => {
      test('warns when `toAttribute` returns undefined with migration warnings on', async () => {
        class WarnAttribute extends ReactiveElement {
          static override properties = {
            foo: {converter: {toAttribute: () => undefined}, reflect: true},
          };

          foo = 'hi';
        }
        WarnAttribute.enableWarning?.('migration');
        customElements.define(generateElementName(), WarnAttribute);
        const a = new WarnAttribute();
        container.appendChild(a);
        await a.updateComplete;
        assert.equal(warnings.length, 1);
        assert.include(warnings[0], 'undefined');
        // warns once, does not spam
        a.foo = 'more';
        await a.updateComplete;
        assert.equal(warnings.length, 1);
      });

      test('warns when update triggers another update if element', async () => {
        class WarnUpdate extends ReactiveElement {
          shouldUpdateAgain = false;
          override updated() {
            if (this.shouldUpdateAgain) {
              this.shouldUpdateAgain = false;
              this.requestUpdate();
            }
          }
        }
        customElements.define(generateElementName(), WarnUpdate);
        const a = new WarnUpdate();
        container.appendChild(a);
        await a.updateComplete;
        assert.equal(warnings.length, 0);
        a.shouldUpdateAgain = true;
        a.requestUpdate();
        await a.updateComplete;
        assert.equal(warnings.length, 1);
        assert.include(warnings[0], a.localName);
        assert.include(warnings[0], 'update');
        assert.include(warnings[0], 'scheduled');
        warnings = [];
        a.requestUpdate();
        await a.updateComplete;
        assert.equal(warnings.length, 0);
        // warns once, does not spam
        a.shouldUpdateAgain = true;
        a.requestUpdate();
        await a.updateComplete;
        assert.equal(warnings.length, 0);
      });

      test('warning settings can be set on base class and per class', async () => {
        class WarningSettings extends ReactiveElement {
          shouldUpdateAgain = false;
          override updated() {
            if (this.shouldUpdateAgain) {
              this.shouldUpdateAgain = false;
              this.requestUpdate();
            }
          }
        }
        customElements.define(generateElementName(), WarningSettings);
        class WarningSettingsSub extends WarningSettings {}
        customElements.define(generateElementName(), WarningSettingsSub);
        const a = new WarningSettings();
        container.appendChild(a);
        const b = new WarningSettingsSub();
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
        WarningSettings.disableWarning?.('change-in-update');
        await triggerChangeInUpdate();
        assert.equal(warnings.length, 0);
        // Explicitly turn on warning in subclass
        WarningSettingsSub.enableWarning?.('change-in-update');
        warnings = [];
        await triggerChangeInUpdate();
        assert.equal(warnings.length, 1);
        // Turn of warning in subclass and back on in base class
        WarningSettingsSub.disableWarning?.('change-in-update');
        WarningSettings.enableWarning?.('change-in-update');
        warnings = [];
        await triggerChangeInUpdate();
        assert.equal(warnings.length, 1);
      });
    });

    test('Warns on async performUpdate', async () => {
      class C extends ReactiveElement {
        // It would be nice if we could get TypeScript to warn here, but
        // unfortunately anything is assignable to `void`. A return type of
        // `undefined` is not possible in the superclass because `void` is not
        // assignable to `undefined`.
        override async performUpdate() {
          super.performUpdate();
        }
      }
      customElements.define(generateElementName(), C);
      const el = new C();
      container.append(el);

      assert.equal(warnings.length, 0);
      await el.updateComplete;

      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'async-perform-update');
    });
  });
}
