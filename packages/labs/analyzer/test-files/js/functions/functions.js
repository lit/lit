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
 * @param {string} a Param a description
 * @param {boolean} b Param b description
 * with wraparound
 *
 * @param {number[]} c Param c description
 * @returns {string} Function 2 return description
 *
 * @deprecated Function 2 deprecated
 */
export function function2(a, b = false, ...c) {
  return b ? a : c[0].toFixed();
}

/**
 * Default function description
 * @returns {string} Default function return description
 */
export default function () {
  return 'default';
}

/**
 * This function has an overloaded signature in TS.
 * @param {string | number} x Some value, either a string or a number.
 * @returns {string | number} Returns either a string or a number.
 */
export function overloaded(x) {
  if (typeof x === 'string') {
    return x + 'abc';
  } else {
    return x + 123;
  }
}

/**
 * This is not the implementation signature, but there are no docs on the
 * implementation signature.
 * @param {string | number} x This might be a string or a number, even though
 * this signature only allows strings.
 * @returns {string | number} Returns either a string or a number, but this
 * signature only mentions `string`.
 */
export function overloadedWithDocsOnOverloadOnly(x) {
  if (typeof x === 'string') {
    return x + 'abc';
  } else {
    return x + 123;
  }
}

/**
 * This is the implementation signature.
 * @param {string | number} x Maybe a string, maybe a number.
 * @returns {string | number} Returns either a string or a number, depending on
 * the mood.
 */
export function overloadedWithDocsOnMany(x) {
  if (typeof x === 'string') {
    return x + 'abc';
  } else {
    return x + 123;
  }
}
