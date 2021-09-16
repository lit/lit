/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {TemplateLike} from './types';

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

export const isStrTagged = (val: TemplateLike): val is StrResult =>
  typeof val !== 'string' && 'strTag' in val;

/**
 * Render the result of a `str` tagged template to a string. Note we don't need
 * to do this for Lit templates, since Lit itself handles rendering.
 */
export const joinStringsAndValues = (
  strings: TemplateStringsArray,
  values: Readonly<unknown[]>,
  valueOrder?: number[]
) => {
  let concat = strings[0];
  for (let i = 1; i < strings.length; i++) {
    concat += values[valueOrder ? valueOrder[i - 1] : i - 1];
    concat += strings[i];
  }
  return concat;
};
