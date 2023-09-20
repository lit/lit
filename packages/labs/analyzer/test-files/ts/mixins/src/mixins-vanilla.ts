/**
 * @license
 * Copyright 2022 Google LLC
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
