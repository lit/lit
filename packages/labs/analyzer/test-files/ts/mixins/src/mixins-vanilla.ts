/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

/**
 * Some mixin
 * @mixin
 * @template {Constructor<HTMLElement>} T
 * @param {T} superClass
 * @return T
 */
export const MixinA = <T extends Constructor<HTMLElement>>(superClass: T) => {
  class MixedElement extends superClass {
    someMethod() {
      return 303;
    }
  }
  return MixedElement;
};

// Usage
export class MixedInA extends MixinA(HTMLElement) {}

/**
 * A mixin with an expression body
 * @mixin
 * @template {Constructor<HTMLElement>} T
 * @param {T} superClass
 * @return T
 */
export const MixinWithExpression = <T extends Constructor<HTMLElement>>(
  superClass: T
) =>
  class MixedElement extends superClass {
    someMethod() {
      return 303;
    }
  };

/**
 * A mixin with a returned expression
 * @mixin
 * @template {Constructor<HTMLElement>} T
 * @param {T} superClass
 * @return T
 */
export const MixinWithExpressionReturn = <T extends Constructor<HTMLElement>>(
  superClass: T
) => {
  return class MixedElement extends superClass {
    someMethod() {
      return 303;
    }
  };
};
