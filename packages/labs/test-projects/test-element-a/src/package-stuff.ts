/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export interface BarInterface {
  bar: boolean;
}

export class Bar implements BarInterface {
  bar = true;
}

export class Foo<T extends BarInterface> {
  bar?: T;
}

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
