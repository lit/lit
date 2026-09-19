/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {directive} from '../directive.js';
import type {PartInfo} from '../directive.js';
import {
  DOMTokenAttribute,
  DOMTokenMapDirective,
} from './private-dom-token-map.js';
import type {DOMTokenMap} from './private-dom-token-map.js';

/**
 * A key-value set of part names to truthy values.
 */
export type PartInfoMap = DOMTokenMap;

class PartMapDirective extends DOMTokenMapDirective {
  constructor(partInfo: PartInfo) {
    super(partInfo, DOMTokenAttribute.PART);
  }
}

/**
 * A directive that applies dynamic CSS parts.
 *
 * This must be used in the `part` attribute and must be the only part used in
 * the attribute. It takes each property in the `partInfo` argument and adds
 * the property name to the element's `part` list if the property value is
 * truthy; if the property value is falsy, the property name is removed from
 * the element's `part`.
 *
 * For example `{foo: bar}` applies the part `foo` if the value of `bar` is
 * truthy.
 *
 * @param partInfo
 */
export const partMap = directive(PartMapDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type {PartMapDirective};
