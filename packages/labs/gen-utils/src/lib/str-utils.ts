/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Generic tagged-template literal string concatenator with array value
 * flattening. Can be assigned to various tag names for syntax highlighting.
 */
const concat = (strings: TemplateStringsArray, ...values: unknown[]) =>
  values.reduce(
    (acc: string, v, i) =>
      acc + (Array.isArray(v) ? v.flat(Infinity).join('') : v) + strings[i + 1],
    strings[0]
  );

/**
 * Use https://marketplace.visualstudio.com/items?itemName=zjcompt.es6-string-javascript
 * for JS syntax highlighting
 */
export const javascript = concat;

/**
 * Use https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html
 * for HTML syntax highlighting
 */
export const html = concat;

/**
 * Converts string to initial cap.
 */
export const toInitialCap = (str: string) =>
  str ? `${str[0].toUpperCase()}${str.slice(1)}` : str;

/**
 * Converts kabob-case string to PascalCase.
 */
export const kabobToPascalCase = (str: string) =>
  toInitialCap(str).replace(/-[a-z]/g, (m) => m[1].toUpperCase());

/**
 * Converts kabob-case event name to an "on" event: `onEventName`.
 */
export const kabobToOnEvent = (str: string) => `on${kabobToPascalCase(str)}`;
