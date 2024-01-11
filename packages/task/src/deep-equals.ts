/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export const deepArrayEquals = <T extends ReadonlyArray<unknown>>(
  oldArgs: T,
  newArgs: T
) =>
  oldArgs === newArgs ||
  (oldArgs.length === newArgs.length &&
    oldArgs.every((v, i) => deepEquals(v, newArgs[i])));

const objectValueOf = Object.prototype.valueOf;
const objectToString = Object.prototype.toString;
const {keys: objectKeys} = Object;
const {isArray} = Array;

/**
 * Recursively checks two objects for equality.
 *
 * This function handles the following cases:
 *  - Primitives: primitives compared with Object.is()
 *  - Objects: to be equal, two objects must:
 *    - have the same constructor
 *    - have same set of own property names
 *    - have each own property be deeply equal
 *  - Arrays, Maps, Sets, and RegExps
 *  - Objects with custom valueOf() (ex: Date)
 *  - Objects with custom toString() (ex: URL)
 *
 * Important: Objects must be free of cycles, otherwise this function will
 * run infinitely!
 */
export const deepEquals = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) {
    return true;
  }

  if (
    a !== null &&
    b !== null &&
    typeof a === 'object' &&
    typeof b === 'object'
  ) {
    // Object must have the same prototype / constructor
    if (a.constructor !== b.constructor) {
      return false;
    }

    // Arrays must have the same length and recursively equal items
    if (isArray(a)) {
      if (a.length !== (b as Array<unknown>).length) {
        return false;
      }
      return a.every((v, i) => deepEquals(v, (b as Array<unknown>)[i]));
    }

    // Defer to custom valueOf implementations. This handles Dates which return
    // ms since epoch: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/valueOf
    if (a.valueOf !== objectValueOf) {
      return a.valueOf() === b.valueOf();
    }

    // Defer to custom toString implementations. This should handle
    // TrustedTypes, URLs, and such. This might be a bit risky, but
    // fast-deep-equals does it.
    if (a.toString !== objectToString) {
      return a.toString() === b.toString();
    }

    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) {
        return false;
      }
      for (const [k, v] of a.entries()) {
        if (
          deepEquals(v, b.get(k)) === false ||
          (v === undefined && b.has(k) === false)
        ) {
          return false;
        }
      }
      return true;
    }

    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) {
        return false;
      }
      for (const k of a.keys()) {
        if (b.has(k) === false) {
          return false;
        }
      }
      return true;
    }

    if (a instanceof RegExp) {
      return (
        a.source === (b as RegExp).source && a.flags === (b as RegExp).flags
      );
    }

    // We have two objects, check every key
    const keys = objectKeys(a) as Array<keyof typeof a>;

    if (keys.length !== objectKeys(b).length) {
      return false;
    }

    for (const key of keys) {
      if (!b.hasOwnProperty(key) || !deepEquals(a[key], b[key])) {
        return false;
      }
    }

    // All keys in the two objects have been compared!
    return true;
  }

  return false;
};
