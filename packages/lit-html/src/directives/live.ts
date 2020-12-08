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
  Directive,
  AttributePart,
  noChange,
  nothing,
  PartInfo,
  NODE_PART,
  EVENT_PART,
  PROPERTY_PART,
  BOOLEAN_ATTRIBUTE_PART,
  ATTRIBUTE_PART,
  ELEMENT_PART,
} from '../lit-html.js';
import {resetPartValue} from '../parts.js';

class LiveDirective extends Directive {
  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (
      partInfo.type === EVENT_PART ||
      partInfo.type === NODE_PART ||
      partInfo.type === ELEMENT_PART
    ) {
      throw new Error(
        'The `live` directive is not allowed on text or event bindings'
      );
    }
    if (partInfo.strings !== undefined) {
      throw new Error('`live` bindings can only contain a single expression');
    }
  }

  render(value: unknown) {
    return value;
  }

  update(part: AttributePart, [value]: Parameters<this['render']>) {
    if (value === noChange) {
      return value;
    }
    const element = part.element;
    const name = part.name;

    // TODO (justinfagnani): This is essentially implementing a getLiveValue()
    // method for each part type. Should that be moved into the AttributePart
    // interface?
    if (part.type === PROPERTY_PART) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (value === (element as any)[name]) {
        return noChange;
      }
    } else if (part.type === BOOLEAN_ATTRIBUTE_PART) {
      if (
        (value === nothing ? false : !!value) === element.hasAttribute(name)
      ) {
        return noChange;
      }
    } else if (part.type === ATTRIBUTE_PART) {
      if (element.getAttribute(name) === String(value)) {
        return noChange;
      }
    }
    // Resets the part's value, causing its dirty-check to fail so that it
    // always sets the value.
    resetPartValue(part);
    return value;
  }
}

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
 * it alone. If this is not what you want--if you want to overwrite the DOM
 * value with the bound value no matter what--use the `live()` directive:
 *
 *     html`<input .value=${live(x)}>`
 *
 * `live()` performs a strict equality check agains the live DOM value, and if
 * the new value is equal to the live value, does nothing. This means that
 * `live()` should not be used when the binding will cause a type conversion. If
 * you use `live()` with an attribute binding, make sure that only strings are
 * passed in, or the binding will update every render.
 */
export const live = directive(LiveDirective);
