/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ChildPart} from '../lit-html.js';
import {
  directive,
  DirectiveParameters,
  PartInfo,
  PartType,
} from '../directive.js';
import {AsyncReplaceDirective} from './async-replace.js';
import {
  clearPart,
  insertPart,
  setChildPartValue,
} from '../directive-helpers.js';

class AsyncAppendDirective extends AsyncReplaceDirective {
  private __childPart!: ChildPart;

  protected validatePartType(partInfo: PartInfo) {
    if (partInfo.type !== PartType.CHILD) {
      throw new Error('asyncAppend can only be used in child expressions');
    }
  }

  update(part: ChildPart, params: DirectiveParameters<this>) {
    this.__childPart = part;
    return super.update(part, params);
  }

  // Override point for AsyncReplace to replace rather than append
  protected commitValue(value: unknown) {
    // When we get the first value, clear the part. This lets the
    // previous value display until we can replace it.
    if (this.index === 0) {
      clearPart(this.__childPart);
    }
    const newPart = insertPart(this.__childPart);
    setChildPartValue(newPart, value);
  }
}

/**
 * A directive that renders the items of an async iterable[1], appending new
 * values after previous values, similar to the built-in support for iterables.
 * This directive is usable only in child expressions.
 *
 * Async iterables are objects with a [Symbol.asyncIterator] method, which
 * returns an iterator who's `next()` method returns a Promise. When a new
 * value is available, the Promise resolves and the value is appended to the
 * Part controlled by the directive. If another value other than this
 * directive has been set on the Part, the iterable will no longer be listened
 * to and new values won't be written to the Part.
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
 *
 * @param value An async iterable
 * @param mapper An optional function that maps from (value, index) to another
 *     value. Useful for generating templates for each item in the iterable.
 */
export const asyncAppend = directive(AsyncAppendDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type {AsyncAppendDirective};
