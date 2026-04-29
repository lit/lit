/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @typedef {new (...args: any[]) => object} Constructor
 */

/**
 * Some mixin
 * @mixin
 * @template {Constructor} T
 * @param {T} superClass
 * @return T
 */
export const MixinA = (superClass) => {
  class MixedClass extends superClass {
    someMethod() {
      return 303;
    }
  }
  return MixedClass;
};

// Base class
export class BaseClass {}

// Usage
export class MixedInA extends MixinA(BaseClass) {}
