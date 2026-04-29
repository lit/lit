/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor = new (...args: any[]) => object;

/**
 * Some mixin
 * @mixin
 * @template {Constructor} T
 * @param {T} superClass
 * @return T
 */
export const MixinA = <T extends Constructor>(superClass: T) => {
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
