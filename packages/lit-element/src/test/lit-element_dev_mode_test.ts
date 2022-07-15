/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit-element';
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

    const litWarnings = globalThis.litIssuedWarnings!;

    test('warns for dev mode only 1x', () => {
      assert.equal(
        Array.from(litWarnings).filter((v) => v?.includes('dev mode')).length,
        1
      );
    });

    test('warns when `static render` is implemented', () => {
      class WarnRender extends LitElement {
        static render() {}
      }
      customElements.define(generateElementName(), WarnRender);
      new WarnRender();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'render');
    });

    test('warns on first instance only', () => {
      class WarnFirstInstance extends LitElement {
        static render() {}
      }
      customElements.define(generateElementName(), WarnFirstInstance);
      new WarnFirstInstance();
      new WarnFirstInstance();
      new WarnFirstInstance();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'render');
    });

    test('warns once per implementation (does not spam)', () => {
      class WarnPerImpl extends LitElement {
        static render() {}
      }
      customElements.define(generateElementName(), WarnPerImpl);
      class WarnPerImplSub extends WarnPerImpl {}
      customElements.define(generateElementName(), WarnPerImplSub);
      new WarnPerImpl();
      new WarnPerImplSub();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], WarnPerImpl.name);
      assert.include(warnings[0], 'render');
    });

    test('warns when `static getStyles` is implemented', () => {
      class WarnGetStyles extends LitElement {
        static getStyles() {}
      }
      customElements.define(generateElementName(), WarnGetStyles);
      new WarnGetStyles();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'getStyles');
    });

    test('warns when `adoptStyles` is implemented', () => {
      class WarnAdoptStyles extends LitElement {
        adoptStyles() {}
      }
      customElements.define(generateElementName(), WarnAdoptStyles);
      new WarnAdoptStyles();
      assert.equal(warnings.length, 1);
      assert.include(warnings[0], 'adoptStyles');
    });
  });
}
