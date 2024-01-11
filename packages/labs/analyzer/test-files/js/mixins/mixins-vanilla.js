/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @template T
 * @typedef {new (...args: any[]) => T} Constructor
 */

/**
 * Some mixin
 * @mixin
 * @template {Constructor<HTMLElement>} T
 * @param {T} superClass
 * @return T
 */
export const MixinA = (superClass) => {
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
export const MixinWithExpression = (superClass) =>
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
export const MixinWithExpressionReturn = (superClass) => {
  return class MixedElement extends superClass {
    someMethod() {
      return 303;
    }
  };
};
