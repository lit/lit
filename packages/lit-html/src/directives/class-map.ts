/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2018 Google LLC
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
 * A key-value set of class names to truthy values.
 */
export type ClassInfo = DOMTokenMap;

class ClassMapDirective extends DOMTokenMapDirective {
  constructor(partInfo: PartInfo) {
    super(partInfo, DOMTokenAttribute.CLASS);
  }
}

/**
 * A directive that applies dynamic CSS classes.
 *
 * This must be used in the `class` attribute and must be the only part used in
 * the attribute. It takes each property in the `classInfo` argument and adds
 * the property name to the element's `classList` if the property value is
 * truthy; if the property value is falsy, the property name is removed from
 * the element's `class`.
 *
 * For example `{foo: bar}` applies the class `foo` if the value of `bar` is
 * truthy.
 *
 * @param classInfo
 */
export const classMap = directive(ClassMapDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type {ClassMapDirective};
