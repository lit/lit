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

import {directive, Directive, NodePart} from '../lit-html.js';

const previousExpressions = new WeakMap<NodePart, any>();

/**
 * Creates a guard directive. Prevents any re-render until the identity of the
 * expression changes, for example when a primitive changes value or when an
 * object reference changes.
 *
 * This useful with immutable data patterns, by preventing expensive work until
 * data updates. Example:
 *
 * html`
 *   <div>
 *     ${guard(items, () => items.map(item => html`${item}`))}
 *   </div>
 * `
 *
 * In this case, items are mapped over only when the array reference changes.
 *
 * @param expression the expression to check before re-rendering
 * @param valueFn function which returns the render value
 */
export const guard =
    (expression: any, valueFn: () => any): Directive<NodePart> =>
        directive((part: NodePart): void => {
          // Dirty check previous expression
          if (previousExpressions.get(part) === expression) {
            return;
          }

          part.setValue(valueFn());
          previousExpressions.set(part, expression);
        });
