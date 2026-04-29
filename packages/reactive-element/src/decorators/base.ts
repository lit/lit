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

/**
 * Wraps up a few best practices when returning a property descriptor from a
 * decorator.
 *
 * Marks the defined property as configurable, and enumerable, and handles
 * the case where we have a busted Reflect.decorate zombiefill (e.g. in Angular
 * apps).
 *
 * @internal
 */
export const desc = (
  obj: object,
  name: PropertyKey | ClassAccessorDecoratorContext<unknown, unknown>,
  descriptor: PropertyDescriptor
) => {
  // For backwards compatibility, we keep them configurable and enumerable.
  descriptor.configurable = true;
  descriptor.enumerable = true;
  if (
    // We check for Reflect.decorate each time, in case the zombiefill
    // is applied via lazy loading some Angular code.
    (Reflect as typeof Reflect & {decorate?: unknown}).decorate &&
    typeof name !== 'object'
  ) {
    // If we're called as a legacy decorator, and Reflect.decorate is present
    // then we have no guarantees that the returned descriptor will be
    // defined on the class, so we must apply it directly ourselves.

    Object.defineProperty(obj, name, descriptor);
  }
  return descriptor;
};
