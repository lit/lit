/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EqualityCheck<T = any> = (a: T, b: T) => boolean;

export const tripleEquals: EqualityCheck = (a, b) => a === b;

export const shallowEquals: EqualityCheck = (a, b) => {
  if (a === b) {
    return true;
  }

  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false;
  }

  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }

  for (const k of keys) {
    if (
      (a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]
    ) {
      return false;
    }
  }

  return true;
};
