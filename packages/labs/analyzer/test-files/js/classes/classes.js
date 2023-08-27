/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export class BaseClass {}

export class Class1 extends BaseClass {
  /**
   * Class field 1 description
   * with wraparound
   * @private
   */
  field1 = 'default1';

  /**
   * @summary Class field 2 summary
   * with wraparound
   *
   * @description Class field 2 description
   * with wraparound
   * @protected
   * @type {number | string}
   */
  field2;

  /**
   * @description Class field 3 description
   * with wraparound
   * @optional
   * @type {string}
   * @deprecated
   */
  field3;

  /**
   * Class field 4 description
   * with wraparound
   * @summary Class field 4 summary
   * with wraparound
   * @type {Promise<void>}
   * @deprecated Class field 4 deprecated
   */
  field4 = new Promise((r) => r());

  /** ecma private field */
  #privateField = 'private';

  /**
   * ecma private method
   * @param {string} a
   */
  #privateMethod(a) {
    this.#privateField = a;
  }

  /**
   * Method 1 description
   * with wraparound
   */
  method1() {}

  /**
   * @summary Method 2 summary
   * with wraparound
   *
   * @description Method 2 description
   * with wraparound
   *
   * @param {string} a Param a description
   * @param {boolean} b Param b description
   * with wraparound
   *
   * @param {number[]} c Param c description
   * @returns {string} Method 2 return description
   *
   * @deprecated Method 2 deprecated
   */
  method2(a, b = false, ...c) {
    return b ? a : c[0].toFixed();
  }

  /**
   * @summary Static class field 1 summary
   * @description Static class field 1 description
   * @protected
   * @type {number | string}
   */
  static field1;

  /**
   * @summary Static method 1 summary
   * @description Static method 1 description
   * @param {string} a Param a description
   * @param {boolean} b Param b description
   * @param {number[]} c Param c description
   * @returns {string} Static method 1 return description
   * @deprecated Static method 1 deprecated
   */
  static method1(a, b = false, ...c) {
    return b ? a : c[0].toFixed();
  }
}

/**
 * @description TaggedDescription description. Lorem ipsum dolor sit amet, consectetur
 * adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
 * aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
 * nisi ut aliquip ex ea commodo consequat.
 * @summary TaggedDescription summary.
 * @deprecated TaggedDescription deprecated message.
 */
export class TaggedDescription extends BaseClass {}

/**
 * UntaggedDescription description. Lorem ipsum dolor sit amet, consectetur
 * adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
 * aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
 * nisi ut aliquip ex ea commodo consequat.
 *
 * @deprecated UntaggedDescription deprecated message.
 * @summary UntaggedDescription summary.
 */
export class UntaggedDescription extends BaseClass {}

/**
 * ConstClass description
 */
export const ConstClass = class IgnoreThisName extends BaseClass {
  /**
   * ConstClass field 1 description
   */
  field1 = 'default1';

  /**
   * ConstClass method 1 description
   */
  method1() {}
};

/**
 * @description ConstClassNoName description
 */
export const ConstClassNoName = class extends BaseClass {
  /**
   * ConstClassNoName field 1 description
   */
  field1 = 'default1';

  /**
   * ConstClassNoName method 1 description
   */
  method1() {}
};

/**
 * default class description
 */
export default class extends BaseClass {
  /**
   * default class field 1 description
   */
  field1 = 'default1';

  /**
   * default class method 1 description
   */
  method1() {}
}
