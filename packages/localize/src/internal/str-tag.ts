/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export interface StrResult {
  strTag: true;
  strings: TemplateStringsArray;
  values: unknown[];
}

/**
 * Tag that allows expressions to be used in localized non-HTML template
 * strings.
 *
 * Example: msg(str`Hello ${this.user}!`);
 *
 * The Lit html tag can also be used for this purpose, but HTML will need to be
 * escaped, and there is a small overhead for HTML parsing.
 *
 * Untagged template strings with expressions aren't supported by lit-localize
 * because they don't allow for values to be captured at runtime.
 */
const _str = (
  strings: TemplateStringsArray,
  ...values: unknown[]
): StrResult => ({
  strTag: true,
  strings,
  values,
});

export const str: typeof _str & {_LIT_LOCALIZE_STR_?: never} = _str;
