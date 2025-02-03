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
  globalThis.litIssuedWarnings ??= new Set();
  globalThis.litIssuedWarnings!.add('dev-mode');

  suite('Can disable developer mode warning', () => {
    const warnings: string[] = [];

    const consoleWarn = console.warn;

    suiteSetup(() => {
      console.warn = (message: string) => warnings.push(message);
    });

    suiteTeardown(() => {
      console.warn = consoleWarn;
    });

    const litWarnings = globalThis.litIssuedWarnings!;

    test('dev mode waring was disabled', () => {
      // Ensure lit-html package is imported
      void html``;
      assert.lengthOf(
        Array.from(litWarnings).filter((v) => v?.includes('dev mode')),
        0
      );
      assert.lengthOf(
        Array.from(litWarnings).filter((v) => v?.includes('dev-mode')),
        1
      );
      assert.equal(litWarnings?.size, 1);
    });
  });
}
