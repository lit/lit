/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

/**
 * A cool custom element.
 *
 * @slot - Description for default slot
 * @slot no-description
 * @slot with-description Description for with-description
 * with wraparound
 * @slot with-description-dash - Description for with-description-dash
 * @cssPart no-description
 * @cssPart with-description Description for :part(with-description)
 * with wraparound
 * @cssPart with-description-dash - Description for :part(with-description-dash)
 * @cssProperty --no-description
 * @cssProperty --with-description Description for --with-description
 * with wraparound
 * @cssProperty --with-description-dash - Description for --with-description-dash
 * @cssProp --short-no-description
 * @cssProp --short-with-description Description for --short-with-description
 * with wraparound
 * @cssProp --short-with-description-dash - Description for --short-with-description-dash
 */
@customElement('element-a')
export class ElementA extends LitElement {
  /**
   * Class field 1 description
   * with wraparound
   */
  private field1 = 'default1';

  /**
   * @summary Class field 2 summary
   * with wraparound
   *
   * @description Class field 2 description
   * with wraparound
   */
  protected field2: number | string;

  /**
   * @description Class field 3 description
   * with wraparound
   * @deprecated
   */
  field3?: string;

  /**
   * Class field 4 description
   * with wraparound
   * @summary Class field 4 summary
   * with wraparound
   * @deprecated Class field 4 deprecated
   */
  field4 = new Promise<void>((r) => r());

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
   * @param a Param a description
   * @param b Param b description
   * with wraparound
   *
   * @param c Param c description
   * @returns Method 2 return description
   *
   * @deprecated Method 2 deprecated
   */
  method2(a: string, b = false, ...c: number[]) {
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
export class TaggedDescription extends LitElement {}

/**
 * UntaggedDescription description. Lorem ipsum dolor sit amet, consectetur
 * adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
 * aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
 * nisi ut aliquip ex ea commodo consequat.
 *
 * @deprecated UntaggedDescription deprecated message.
 * @summary UntaggedDescription summary.
 */
export class UntaggedDescription extends LitElement {}
