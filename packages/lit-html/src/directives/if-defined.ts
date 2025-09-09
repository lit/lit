/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {nothing} from '../lit-html.js';

/**
 * For AttributeParts, sets the attribute if the value is defined and removes
 * the attribute if the value is undefined by returning Lit's `nothing`
 * sentinel value.
 *
 * For other part types, this directive is a no-op.
 */
export const ifDefined = <T>(value: T) => value ?? nothing;
