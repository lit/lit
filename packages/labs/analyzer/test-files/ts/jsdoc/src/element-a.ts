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
 * @slot basic
 * @slot with-summary Summary for with-summary
 * @slot with-summary-dash - Summary for with-summary-dash
 * @slot with-summary-colon: Summary for with-summary-colon
 * @slot with-description - Summary for with-description
 * Description for with-description
 * More description for with-description
 *
 * Even more description for with-description
 *
 * @cssPart basic
 * @cssPart with-summary Summary for :part(with-summary)
 * @cssPart with-summary-dash - Summary for :part(with-summary-dash)
 * @cssPart with-summary-colon: Summary for :part(with-summary-colon)
 * @cssPart with-description - Summary for :part(with-description)
 * Description for :part(with-description)
 * More description for :part(with-description)
 *
 * Even more description for :part(with-description)
 *
 * @cssProperty --basic
 * @cssProperty --with-summary Summary for --with-summary
 * @cssProperty --with-summary-dash - Summary for --with-summary-dash
 * @cssProperty --with-summary-colon: Summary for --with-summary-colon
 * @cssProperty --with-description - Summary for --with-description
 * Description for --with-description
 * More description for --with-description
 *
 * Even more description for --with-description
 *
 * @cssProp --short-basic
 * @cssProp --short-with-summary Summary for --short-with-summary
 * @cssProp --short-with-summary-dash - Summary for --short-with-summary-dash
 * @cssProp --short-with-summary-colon: Summary for --short-with-summary-colon
 * @cssProp --short-with-description - Summary for --short-with-description
 * Description for --short-with-description
 * More description for --short-with-description
 *
 * Even more description for --short-with-description
 */
@customElement('element-a')
export class ElementA extends LitElement {}

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

/**
 * UntaggedDescSummary summary.
 *
 * UntaggedDescSummary description. Lorem ipsum dolor sit amet, consectetur
 * adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
 * aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
 * nisi ut aliquip ex ea commodo consequat.
 *
 * @deprecated
 */
export class UntaggedDescSummary extends LitElement {}
