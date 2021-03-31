/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Directive, PartInfo} from './directive.js';
import {_Σ as p, AttributePart, noChange, Part} from './lit-html.js';
export type {Template} from './lit-html.js';

/**
 * END USERS SHOULD NOT RELY ON THIS OBJECT.
 *
 * We currently do not make a mangled rollup build of the lit-ssr code. In order
 * to keep a number of (otherwise private) top-level exports mangled in the
 * client side code, we export a _Σ object containing those members (or
 * helper methods for accessing private fields of those members), and then
 * re-export them for use in lit-ssr. This keeps lit-ssr agnostic to whether the
 * client-side code is being used in `dev` mode or `prod` mode.
 * @private
 */
export const _Σ = {
  boundAttributeSuffix: p._boundAttributeSuffix,
  marker: p._marker,
  markerMatch: p._markerMatch,
  HTML_RESULT: p._HTML_RESULT,
  getTemplateHtml: p._getTemplateHtml,
  overrideDirectiveResolve: (
    directiveClass: new (part: PartInfo) => Directive & {render(): unknown},
    resolveOverrideFn: (directive: Directive, values: unknown[]) => unknown
  ) =>
    class extends directiveClass {
      _$resolve(this: Directive, _part: Part, values: unknown[]): unknown {
        return resolveOverrideFn(this, values);
      }
    },
  getAttributePartCommittedValue: (
    part: AttributePart,
    value: unknown,
    index: number | undefined
  ) => {
    // Use the part setter to resolve directives/concatenate multiple parts
    // into a final value (captured by passing in a commitValue override)
    let committedValue: unknown = noChange;
    // Note that _commitValue need not be in `stableProperties` because this
    // method is only run on `AttributePart`s created by lit-ssr using the same
    // version of the library as this file
    part._commitValue = (value: unknown) => (committedValue = value);
    part._$setValue(value, part, index);
    return committedValue;
  },
  resolveDirective: p._resolveDirective,
  AttributePart: p._AttributePart,
  PropertyPart: p._PropertyPart,
  BooleanAttributePart: p._BooleanAttributePart,
  EventPart: p._EventPart,
  ElementPart: p._ElementPart,
};
