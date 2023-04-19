/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

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
 * @cssProperty [--default-no-description=#324fff]
 * @cssProperty [--default-with-description=#324fff] Description for --default-with-description
 * with wraparound
 * @cssProperty [--default-with-description-dash=#324fff] - Description for --default-with-description-dash
 * @cssProperty [--optional-no-description]
 * @cssProperty [--optional-with-description] Description for --optional-with-description
 * with wraparound
 * @cssProperty [--optional-with-description-dash] - Description for --optional-with-description-dash
 * @cssProp --short-no-description
 * @cssProp --short-with-description Description for --short-with-description
 * with wraparound
 * @cssProp --short-with-description-dash - Description for --short-with-description-dash
 */
export class ElementA extends HTMLElement {
  /**
   * Class field 1 description
   */
  field1 = 'default1';

  /**
   * Method 1 description
   */
  method1() {}
}
customElements.define('element-a', HTMLElement);
