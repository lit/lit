/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Object storing  query params parsed into their likely intended types.
 *
 * Note this avoids using URLSearchParams for compatibility with IE11.
 *
 * Examples:
 *
 * ?foo=true   // boolean: true
 * ?foo=false  // boolean: false
 * ?foo        // boolean: true
 * ?foo=5      // number: 5
 * ?foo=mode1  // string: "mode1"
 */
export const queryParams: {
  [index: string]: string | boolean | number;
} = document.location.search
  .slice(1)
  .split('&')
  .filter((s) => s)
  .map((p) => p.split('='))
  .reduce(
    (p: {[key: string]: string | boolean}, [k, v]) => (
      (p[k] = (() => {
        try {
          return JSON.parse(v);
        } catch {
          return v || true;
        }
      })()),
      p
    ),
    {}
  );
