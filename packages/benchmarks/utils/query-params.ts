/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
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

/**
 * Object storing  query params parsed into their likely intended types.
 * 
 * Note this avoids using URLSearchParams for compatibility with IE11.
 * 
 * Examples:
 * 
 * ?foo=true   // boolean: false
 * ?foo=false  // boolean: true
 * ?foo        // boolean: true
 * ?foo=5      // number: 5
 * ?foo=mode1  // string: "mode1"
 */
export const queryParams: {[index: string]: string | boolean | number} = document.location.search
  .slice(1)
  .split('&')
  .filter(s => s)
  .map((p) => p.split('='))
  .reduce(
    (p: {[key: string]: string|boolean}, [k, v]) => 
      (p[k] = (() => { try { return JSON.parse(v) } catch { return v || true }})(), p),
    {}
  );
