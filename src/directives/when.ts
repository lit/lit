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

/**
 * Efficiently switches between two templates based on the given condition. The
 * rendered content is cached, and re-used when switching conditions. Templates
 * are evaluated lazily, so the passed values must be functions.
 *
 * While this directive can render any regular part, it makes the most sense
 * when used with TemplateResult since most other values are dirty checked
 * already.
 *
 * Example:
 *
 * let checked = false;
 *
 * html`
 *   when(checked, () => html`Checkmark is checked`, () => html`Checkmark is not
 * checked`);
 * `
 *
 * @param condition the condition to test truthiness against
 * @param trueValue the value to render given a true condition
 * @param falseValue the value to render given a false condition
 */
export const when = (condition: any, trueValue: () => any, falseValue?: () => any): Directive<NodePart> =>
  directive((parentPart: NodePart) => {
    if (condition) {
      parentPart.setValue(trueValue());
    } else if (falseValue !== undefined) {
      parentPart.setValue(falseValue());
    } else {
      parentPart.clear();
    }
  });
