/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {directive} from '../directive.js';
import {UnsafeHTML} from './unsafe-html.js';

const SVG_RESULT = 2;

class UnsafeSVG extends UnsafeHTML {
  static directiveName = 'unsafeSVG';
  static resultType = SVG_RESULT;
}

/**
 * Renders the result as SVG, rather than text.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
export const unsafeSVG = directive(UnsafeSVG);
