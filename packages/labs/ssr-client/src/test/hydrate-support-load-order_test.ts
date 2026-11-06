/**
 * @license
 * Copyright The Lit Project Contributors.
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Intentionally load LitElement before the hydrate support module. Module
// evaluation follows import order.
import {LitElement} from 'lit';
import {warnings, stopCapture} from './load-order-warning-capture.js';
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import {assert} from 'chai';

stopCapture();

// Tests are not built with production support, so detect DEV_MODE from the
// loaded LitElement build.
const DEV_MODE = !!LitElement.enableWarning;

suite('lit-element-hydrate-support load order', () => {
  test('warns if LitElement was loaded first', () => {
    const loadOrderWarnings = warnings.filter((w) =>
      w.includes('lit-element-hydrate-support.js')
    );
    assert.equal(loadOrderWarnings.length, DEV_MODE ? 1 : 0);
  });
});
