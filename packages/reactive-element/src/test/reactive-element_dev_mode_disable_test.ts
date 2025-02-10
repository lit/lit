/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '@lit/reactive-element';
import {assert} from 'chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!ReactiveElement.enableWarning;

if (DEV_MODE) {
  globalThis.litIssuedWarnings ??= new Set();
  globalThis.litIssuedWarnings!.add('dev-mode');
  globalThis.litIssuedWarnings!.add('polyfill-support-missing');

  suite('Can disable developer mode warning', () => {
    let container: HTMLElement;

    const missingPlatformSupport =
      window.ShadyDOM?.inUse &&
      !globalThis[`reactiveElementPolyfillSupport${DEV_MODE ? `DevMode` : ``}`];

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

    suite('Initial warnings', () => {
      test('disabled warning of dev mode', () => {
        assert.isFalse(
          Array.from(litWarnings).some((v) => v?.includes('Lit is in dev mode'))
        );
        assert.isTrue(
          Array.from(litWarnings).some((v) => v?.includes('dev-mode'))
        );
      });

      (missingPlatformSupport ? test : test.skip)(
        'warns for missing polyfill-support',
        () => {
          assert.isFalse(
            Array.from(litWarnings).some((v) =>
              v?.includes('`polyfill-support`')
            )
          );
          assert.isTrue(
            Array.from(litWarnings).some((v) =>
              v?.includes('polyfill-support-missing')
            )
          );
        }
      );
    });
  });
}
