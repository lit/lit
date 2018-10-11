/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

import { directive, Directive, NodePart } from '../lit-html.js';

export type WhenValue = () => any;
export type CaseMap = { [key: string]: WhenValue };

/**
 * Directive for handling conditional logic inside templates. One or
 * two function parameters are treated as if or if/else statements. The
 * first parameter is checked against truthiness and the associated value
 * is rendered.
 *
 * An object is treated as a case switch, where the condition is used as
 * key to render the value of the matched case on the object. If no condition
 * matches the default case is rendered if present. Keys can be strings and symbols.
 *
 * Templates are re-instantiated each re-render. For caching nodes between renders,
 * see the cachingWhen directive.
 *
 * @param condition the condition to check for truthiness
 * @param caseMap object where keys are cases and values are functions which return the value to render
 * @param trueValue function that returns the value to render in case of truthiness
 * @param falseValue function that returns the value to render in case of falsiness
 */
export function when(condition: any, trueValue: WhenValue, falseValue?: WhenValue): Directive<NodePart>;
export function when(condition: any, caseMap: CaseMap): Directive<NodePart>;
export function when(condition: any, trueValueOrCaseMap: WhenValue | CaseMap, falseValue?: WhenValue): Directive<NodePart> {
  let caseMap: CaseMap;
  let trueValue: WhenValue;

  // test whether we are in case or in if/else mode
  if (typeof trueValueOrCaseMap === 'object') {
    caseMap = trueValueOrCaseMap;
  } else {
    trueValue = trueValueOrCaseMap;
  }

  return directive((part: NodePart) => {
    let nextValue: WhenValue | undefined;

    if (caseMap) {
      nextValue = caseMap[condition] || caseMap.default;
    } else {
      nextValue = condition ? trueValue : falseValue;
    }

    part.setValue(nextValue ? nextValue() : undefined);
    part.commit();
  });
}