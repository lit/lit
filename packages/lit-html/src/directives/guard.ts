/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {noChange, Part} from '../lit-html.js';
import {
  directive,
  Directive,
  DirectiveParameters,
  DirectiveResult,
} from '../directive.js';

// A sentinel that indicates guard() hasn't rendered anything yet
const initialValue = {};

class GuardDirective<T> extends Directive {
  private _previousValue: unknown = initialValue;

  render(_value: unknown, f: () => T): T {
    return f();
  }

  override update(_part: Part, [value, f]: DirectiveParameters<this>) {
    if (Array.isArray(value)) {
      // Dirty-check arrays by item
      if (
        Array.isArray(this._previousValue) &&
        this._previousValue.length === value.length &&
        value.every((v, i) => v === (this._previousValue as Array<unknown>)[i])
      ) {
        return noChange;
      }
    } else if (this._previousValue === value) {
      // Dirty-check non-arrays by identity
      return noChange;
    }

    // Copy the value if it's an array so that if it's mutated we don't forget
    // what the previous values were.
    this._previousValue = Array.isArray(value) ? Array.from(value) : value;
    const r = this.render(value, f);
    return r;
  }
}

interface Guard {
  <T>(vals: unknown[], f: () => T): DirectiveResult<typeof GuardDirective<T>>;
}

/**
 * Prevents re-render of a template function until a single value or an array of
 * values changes.
 *
 * Values are checked against previous values with strict equality (`===`), and
 * so the check won't detect nested property changes inside objects or arrays.
 * Arrays values have each item checked against the previous value at the same
 * index with strict equality. Nested arrays are also checked only by strict
 * equality.
 *
 * Example:
 *
 * ```js
 * html`
 *   <div>
 *     ${guard([user.id, company.id], () => html`...`)}
 *   </div>
 * `
 * ```
 *
 * In this case, the template only rerenders if either `user.id` or `company.id`
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
 * `
 * ```
 *
 * In this case, items are mapped over only when the array reference changes.
 *
 * @param value the value to check before re-rendering
 * @param f the template function
 */
export const guard: Guard = directive(GuardDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type {GuardDirective};
