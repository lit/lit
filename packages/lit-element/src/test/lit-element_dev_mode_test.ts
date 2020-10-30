/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

import {LitElement} from '../lit-element.js';
import {generateElementName} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

const DEV_MODE = true;

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
