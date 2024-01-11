/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit-element';
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
  });
}
