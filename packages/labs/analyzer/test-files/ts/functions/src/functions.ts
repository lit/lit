/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Function 1 description
 */
export function function1() {}

/**
 * @summary Function 2 summary
 * with wraparound
 *
 * @description Function 2 description
 * with wraparound
 *
 * @param a Param a description
 * @param b Param b description
 * with wraparound
 *
 * @param c Param c description
 * @returns Function 2 return description
 *
 * @deprecated Function 2 deprecated
 */
export function function2(a: string, b = false, ...c: number[]) {
  return b ? a : c[0].toFixed();
}

/**
 * Default function description
 * @returns Default function return description
 */
export default function () {
  return 'default';
}

/**
 * Const function description
 * with wraparound
 *
 * @summary Const function summary
 * with wraparound
 *
 * @param a Param a description
 * @param b Param b description
 * with wraparound
 *
 * @param c Param c description
 * @returns Const function return description
 *
 * @deprecated Const function deprecated
 */
export const constFunction = function ignoreThisName(
  a: string,
  b = false,
  ...c: number[]
) {
  return b ? a : c[0].toFixed();
};

/**
 * @summary Const arrow function summary
 * with wraparound
 *
 * @description Const arrow function description
 * with wraparound
 *
 * @param a Param a description
 * @param b Param b description
 * with wraparound
 *
 * @param c Param c description
 * @returns Const arrow function return description
 *
 * @deprecated Const arrow function deprecated
 */
export const constArrowFunction = (a: string, b = false, ...c: number[]) => {
  return b ? a : c[0].toFixed();
};

/**
 * @description Async function description
 * @param a Param a description
 * @returns Async function return description
 * @deprecated Async function deprecated
 */
export const asyncFunction = async (a: string) => {
  await 0;
  return a;
};
