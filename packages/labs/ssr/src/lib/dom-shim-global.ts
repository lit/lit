/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
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

import {getWindow} from './dom-shim.js';

// Install the dom-shim onto the global
if (globalThis !== globalThis.window) {
  const window = getWindow({}, true);
  window.window = new Proxy(window, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set(_target: {[key: string]: unknown;}, p: string | number | symbol, value: any): boolean {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)[p] = (globalThis as any)[p] = value;
      return true;
    }
  });
  Object.assign(globalThis, window);
}
