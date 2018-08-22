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

import {AttributePart, directive, Directive, Part} from '../lit-html.js';

/**
 * For AttributeParts, sets the attribute if the value is defined and removes
 * the attribute if the value is undefined.
 *
 * For other part types, this directive is a no-op.
 */
export const ifDefined = (value: any): Directive<Part> =>
    directive((part: Part) => {
      if (value === undefined && part instanceof AttributePart) {
        if (value !== part.value) {
          const name = part.committer.name;
          part.committer.element.removeAttribute(name);
        }
      } else {
        part.setValue(value);
      }
    });
