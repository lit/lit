/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit';

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
export const MixinWithLiteralBody = (_superClass) => 5;

/**
 * Mixin without a class declaration
 * @mixin
 */
export const MixinWithoutClass = (superClass) => {
  return superClass;
};

/**
 * Mixin without a return value
 * @mixin
 */
export const MixinWithoutReturn = (superClass) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class Mixed extends superClass {}
};

/**
 * Mixin with a class decl with no extends
 * @mixin
 */
export const MixinWithoutExtends = (_superClass) => {
  class Mixed {}
  return Mixed;
};

/**
 * Mixin without a superclass param
 * @mixin
 */
export const MixinWithoutSuperParam = (_notASuperClass) => {
  class Mixed extends LitElement {}
  return Mixed;
};
