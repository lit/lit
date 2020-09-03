/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
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
  NodePart,
  Directive,
  Part,
  EventPart,
  BooleanAttributePart,
  AttributePart,
  PropertyPart,
  noChange,
  nothing,
} from '../lit-html.js';

/**
 * Checks binding values against live DOM values, instead of previously bound
 * values, when determining whether to update the value.
 *
 * This is useful for cases where the DOM value may change from outside of
 * lit-html, such as with a binding to an `<input>` element's `value` property,
 * a content editable elements text, or to a custom element that changes it's
 * own properties or attributes.
 *
 * In these cases if the DOM value changes, but the value set through lit-html
 * bindings hasn't, lit-html won't know to update the DOM value and will leave
 * it alone. If this is not what you want—if you want to overwrite the DOM
 * value with the bound value no matter what—use the `live()` directive:
 *
 *     html`<input .value=${live(x)}>`
 *
 * `live()` performs a strict equality check agains the live DOM value, and if
 * the new value is equal to the live value, does nothing. This means that
 * `live()` should not be used when the binding will cause a type conversion. If
 * you use `live()` with an attribute binding, make sure that only strings are
 * passed in, or the binding will update every render.
 */

class LiveDirective extends Directive {
  constructor(part: Part) {
    super();
    if (part instanceof EventPart || part instanceof NodePart) {
      throw new Error(
        'The `live` directive is not allowed on text or event bindings'
      );
    }
    if ((part as AttributePart).__strings !== undefined) {
      throw new Error('`live` bindings can only contain a single expression');
    }
  }

  render(value: unknown) {
    return value;
  }

  update(part: AttributePart, [value]: Parameters<this['render']>) {
    const element = part.__element;
    const name = part.name;

    // TODO (justinfagnani): This is essentially implementing a getLiveValue()
    // method for each part type. Should that be moved into the AttributePart
    // interface?
    // TODO (justinfagnani): find alternative to instanceof
    if (part instanceof PropertyPart) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (value === (element as any)[name]) {
        return noChange;
      }
    } else if (part instanceof BooleanAttributePart) {
      if (value == element.hasAttribute(name)) {
        return noChange;
      }
    } else if (part instanceof AttributePart) {
      if (element.getAttribute(name) === String(value)) {
        return noChange;
      }
    }
    // Setting the part's value to nothing causes its dirty-check to fail so
    // that it always sets the value
    part.__value = nothing;
    return value;
  }
}

export const live = directive(LiveDirective);
