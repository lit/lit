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
 *
 * @cssPart no-description
 * @cssPart with-description Description for :part(with-description)
 * with wraparound
 * @cssPart with-description-dash - Description for :part(with-description-dash)
 *
 * @csspart lower-no-description
 * @csspart lower-with-description Description for :part(with-description)
 * with wraparound
 * @csspart lower-with-description-dash - Description for :part(with-description-dash)
 *
 * @cssProperty --no-description
 * @cssProperty --with-description Description for --with-description
 * with wraparound
 * @cssProperty --with-description-dash - Description for --with-description-dash
 * @cssProperty [--default-no-description=#324fff]
 * @cssProperty [--default-with-description=#324fff] Description for --default-with-description
 * with wraparound
 * @cssProperty [--default-with-description-dash=#324fff] - Description for --default-with-description-dash
 * @cssProperty {<color>} --syntax-no-description
 * @cssProp --short-no-description
 * @cssProp --short-with-description Description for --short-with-description
 * with wraparound
 * @cssProp --short-with-description-dash - Description for --short-with-description-dash
 *
 * @cssproperty --lower-no-description
 * @cssproperty --lower-with-description Description for --lower-with-description
 * with wraparound
 * @cssproperty --lower-with-description-dash - Description for --lower-with-description-dash
 * @cssproperty [--lower-default-no-description=#324fff]
 * @cssproperty [--lower-default-with-description=#324fff] Description for --lower-default-with-description
 * with wraparound
 * @cssproperty [--lower-default-with-description-dash=#324fff] - Description for --lower-default-with-description-dash
 * @cssprop --lower-short-no-description
 * @cssprop --lower-short-with-description Description for --lower-short-with-description
 * with wraparound
 * @cssprop --lower-short-with-description-dash - Description for --lower-short-with-description-dash
 *
 * @cssProp {<color>} --syntax-short-no-description
 * @cssProp {<color>} --syntax-short-with-description Description for --syntax-short-with-description
 * with wraparound
 * @cssProp {<color>} --syntax-short-with-description-dash - Description for --syntax-short-with-description-dash
 */
@customElement('element-a')
export class ElementA extends LitElement {
  /**
   * Class field 1 description
   */
  field1 = 'default1';

  /**
   * Method 1 description
   */
  method1() {}
}
