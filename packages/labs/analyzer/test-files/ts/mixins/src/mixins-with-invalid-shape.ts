/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

/**
 * Mixin with no parameters
 * @mixin
 */
export const MixinWithoutParams = () => {
  class Mixed extends LitElement {
    boop() {
      return 808;
    }
  }
  return Mixed;
};

/**
 * Mixin with literal body
 * @mixin
 */
export const MixinWithLiteralBody = <T extends Constructor<LitElement>>(
  _superClass: T
) => 5;

/**
 * Mixin without a class declaration
 * @mixin
 */
export const MixinWithoutClass = <T extends Constructor<LitElement>>(
  superClass: T
) => {
  return superClass;
};

/**
 * Mixin without a return value
 * @mixin
 */
export const MixinWithoutReturn = <T extends Constructor<LitElement>>(
  superClass: T
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class Mixed extends superClass {}
};

/**
 * Mixin with a class decl with no extends
 * @mixin
 */
export const MixinWithoutExtends = <T extends Constructor<LitElement>>(
  _superClass: T
) => {
  class Mixed {}
  return Mixed;
};

/**
 * Mixin without a superclass param
 * @mixin
 */
export const MixinWithoutSuperParam = <T extends Constructor<LitElement>>(
  _notASuperClass: T
) => {
  class Mixed extends LitElement {}
  return Mixed;
};
