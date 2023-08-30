/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Generates a public interface type that removes private and protected fields.
 * This allows accepting otherwise incompatible versions of the type (e.g. from
 * multiple copies of the same package in `node_modules`).
 */
export type Interface<T> = {
  [K in keyof T]: T[K];
};

export type Constructor<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T;
};

export const defineProperty = <T>(
  o: T,
  p: PropertyKey,
  attributes: PropertyDescriptor & ThisType<unknown>
): T => {
  return Object.defineProperty(o, p, {
    enumerable: true,
    configurable: true,
    ...attributes,
  });
};
