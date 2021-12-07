/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Chooses and evaluates a template function from a list based on matching
 * the given `value` to a case.
 *
 * Cases are structured as `[caseValue, func]`. `value` is matched to
 * `caseValue` by strict equality. The first match is selected.
 *
 * This is similar to a switch statement, but as an expression and without
 * fallthrough.
 */
export const choose = <T, V>(
  value: T,
  cases: Array<[T, () => V]>,
  defaultCase?: () => V
) => {
  for (const c of cases) {
    const caseValue = c[0];
    const fn = c[1];
    if (caseValue === value) {
      return fn();
    }
  }
  return defaultCase?.();
};
