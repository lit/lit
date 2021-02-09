/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from '../lit-element.js';
import {generateElementName} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!LitElement.enableWarning;

if (DEV_MODE) {
  suite('Developer mode warnings', () => {
    let container: HTMLElement;
    let warnings: string[] = [];

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

    test('warns when `static render` is implemented', () => {
      class A extends LitElement {
        static render() {}
      }
      customElements.define(generateElementName(), A);
      new A();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'render');
    });

    test('warns on first instance only', () => {
      class A extends LitElement {
        static render() {}
      }
      customElements.define(generateElementName(), A);
      new A();
      new A();
      new A();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'render');
    });

    test('warns when `static getStyles` is implemented', () => {
      class A extends LitElement {
        static getStyles() {}
      }
      customElements.define(generateElementName(), A);
      new A();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'getStyles');
    });

    test('warns when `adoptStyles` is implemented', () => {
      class A extends LitElement {
        adoptStyles() {}
      }
      customElements.define(generateElementName(), A);
      new A();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'adoptStyles');
    });
  });
}
