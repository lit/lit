/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Directive, PartInfo} from './directive.js';
import {_Σ as p, AttributePart, noChange, Part} from './lit-html.js';

/**
 * END USERS SHOULD NOT RELY ON THIS OBJECT.
 *
 * We currently do not make a mangled rollup build of the lit-ssr code. In order
 * to keep a number of (otherwise private) top-level exports  mangled in the
 * client side code, we export a _Σ object containing those members (or
 * helper methods for accessing private fields of those members), and then
 * re-export them for use in lit-ssr. This keeps lit-ssr agnostic to whether the
 * client-side code is being used in `dev` mode or `prod` mode.
 * @private
 *
 */
export const _Σ = {
  boundAttributeSuffix: p._boundAttributeSuffix,
  marker: p._marker,
  markerMatch: p._markerMatch,
  HTML_RESULT: p._HTML_RESULT,
  getTemplateHtml: p._getTemplateHtml,
  overrideDirectiveResolve: (
    directiveClass: new (part: PartInfo) => Directive & {render(): unknown}
  ) =>
    class extends directiveClass {
      _$resolve(this: Directive, _part: Part, values: unknown[]): unknown {
        return this.render(...values);
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
