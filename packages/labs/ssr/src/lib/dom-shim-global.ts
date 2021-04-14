/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {getWindow} from './dom-shim.js';

// Install the dom-shim onto the global
if (globalThis !== globalThis.window) {
  const window = getWindow({}, true);
  // Setup window to proxy all globals added to window to the node global
  window.window = new Proxy(window, {
    set(
      _target: {[key: string]: unknown},
      p: PropertyKey,
      value: unknown
    ): boolean {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)[p] = (globalThis as any)[p] = value;
      return true;
    },
  });
  Object.assign(globalThis, window);
}
