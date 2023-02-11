/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit';

/**
 * A cool custom element.
 *
 * @slot - Description for default slot
 * @slot no-description
 * @slot with-description - Description for with-description
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
export class ElementA extends LitElement {}
customElements.define('element-a', ElementA);
