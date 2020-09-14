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

import {
  directive,
  Directive,
  noChange,
  nothing,
  Part
} from '../lit-html.js';

class Guard extends Directive {
  previousValue: unknown = nothing;

  render(_value: unknown, f: () => unknown) {
    return f();
  }

  update(_part: Part, [value, f]: Parameters<this['render']>) {
    console.log('update', value);
    if (Array.isArray(value)) {
      // Dirty-check arrays by item
      if (Array.isArray(this.previousValue) &&
          this.previousValue.length === value.length &&
          value.every((v, i) => v === (this.previousValue as Array<unknown>)[i])) {
        console.log('A');
        return noChange;
      }
    } else if (
        this.previousValue === value &&
        (value !== undefined || this.previousValue !== nothing)) {
      // Dirty-check non-arrays by identity
      console.log('B');
      return noChange;
    }

    // Copy the value if it's an array so that if it's mutated we don't forget
    // what the previous values were.
    this.previousValue = Array.isArray(value) ? Array.from(value) : value;
    const r = this.render(value, f);
    console.log('R', ((r as any).values as any)[0]);
    return r;
  }
}

/**
 * Prevents re-render of a template function until a single value or an array of
 * values changes.
 *
 * Example:
 *
 * ```js
 * html`
 *   <div>
 *     ${guard([user.id, company.id], () => html`...`)}
 *   </div>
 * ```
 *
 * In this case, the template only renders if either `user.id` or `company.id`
 * changes.
 *
 * guard() is useful with immutable data patterns, by preventing expensive work
 * until data updates.
 *
 * Example:
 *
 * ```js
 * html`
 *   <div>
 *     ${guard([immutableItems], () => immutableItems.map(i => html`${i}`))}
 *   </div>
 * ```
 *
 * In this case, items are mapped over only when the array reference changes.
 *
 * @param value the value to check before re-rendering
 * @param f the template function
 */
export const guard = directive(Guard);
