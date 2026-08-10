/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit-html';
import {assert} from 'chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!globalThis.litIssuedWarnings;

if (DEV_MODE) {
  suite('Developer mode warnings', () => {
    let container: HTMLElement;

    const consoleWarn = console.warn;

    suiteSetup(() => {
      console.warn = () => {};
    });

    suiteTeardown(() => {
      console.warn = consoleWarn;
    });

    setup(() => {
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
      // Ensure lit-html package is imported
      void html``;
      // Ensure the warning message was issued
      assert.equal(
        Array.from(litWarnings).filter((v) => v?.includes('dev mode')).length,
        1
      );
    });
  });
}
