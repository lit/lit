/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit-element';
import {assert} from 'chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!LitElement.enableWarning;

if (DEV_MODE) {
  globalThis.litIssuedWarnings ??= new Set();
  globalThis.litIssuedWarnings!.add('dev-mode');

  suite('Can disable developer mode warning', () => {
    const litWarnings = globalThis.litIssuedWarnings!;

    test('dev mode warning was disabled', () => {
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
