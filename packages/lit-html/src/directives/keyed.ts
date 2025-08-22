/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {nothing} from '../lit-html.js';
import {
  directive,
  Directive,
  ChildPart,
  DirectiveParameters,
  DirectiveResult,
} from '../directive.js';
import {setCommittedValue} from '../directive-helpers.js';

class Keyed<T> extends Directive {
  key: unknown = nothing;

  render(k: unknown, v: T): T {
    this.key = k;
    return v;
  }

  override update(part: ChildPart, [k, v]: DirectiveParameters<this>) {
    if (k !== this.key) {
      // Clear the part before returning a value. The one-arg form of
      // setCommittedValue sets the value to a sentinel which forces a
      // commit the next render.
      setCommittedValue(part);
      this.key = k;
    }
    return v;
  }
}

interface KeyedFunc {
  <V>(k: unknown, v: V): DirectiveResult<typeof Keyed<V>>;
}

/**
 * Associates a renderable value with a unique key. When the key changes, the
 * previous DOM is removed and disposed before rendering the next value, even
 * if the value - such as a template - is the same.
 *
 * This is useful for forcing re-renders of stateful components, or working
 * with code that expects new data to generate new HTML elements, such as some
 * animation techniques.
 */
export const keyed: KeyedFunc = directive(Keyed);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type {Keyed};
