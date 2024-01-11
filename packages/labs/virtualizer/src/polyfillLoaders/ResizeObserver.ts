/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {provideResizeObserver} from '../Virtualizer.js';
export {provideResizeObserver} from '../Virtualizer.js';

/**
 * If your browser support matrix includes older browsers
 * that don't implement `ResizeObserver`, import this function,
 * call it, and await its return before doing anything that
 * will cause a virtualizer to be instantiated. See docs
 * for details.
 */
export async function loadPolyfillIfNeeded() {
  try {
    new ResizeObserver(function () {});
    // Return value for testing purposes
    return ResizeObserver;
  } catch (e) {
    const ROPolyfill = (
      await import('../polyfills/resize-observer-polyfill/ResizeObserver.js')
    ).default;
    provideResizeObserver(ROPolyfill);
    // Return value for testing purposes
    return ROPolyfill;
  }
}
