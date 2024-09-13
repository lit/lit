/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AttributePart, noChange, nothing} from '../lit-html.js';
import {
  directive,
  Directive,
  DirectiveParameters,
  PartInfo,
  PartType,
} from '../directive.js';
import {isSingleExpression, setCommittedValue} from '../directive-helpers.js';

type ValidPartType = 1 | 3 | 4;
type Element = HTMLElement & {[key: string]: unknown};
type GetValueFn = (element: Element, name: string) => unknown;
type EqualFn = (value: unknown, elementValue: unknown) => boolean;

const getValue: Record<ValidPartType, GetValueFn> = {
  [PartType.PROPERTY]: (element, name) => element[name],
  [PartType.BOOLEAN_ATTRIBUTE]: (element, name) => element.hasAttribute(name),
  [PartType.ATTRIBUTE]: (element, name) => element.getAttribute(name),
};

const defaults: Record<ValidPartType, EqualFn> = {
  [PartType.PROPERTY]: (value, elementValue) => value === elementValue,
  [PartType.BOOLEAN_ATTRIBUTE]: (value, elementValue) =>
    !!value === elementValue,
  [PartType.ATTRIBUTE]: (value, elementValue) => elementValue === String(value),
};

class LiveDirective extends Directive {
  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (
      !(
        partInfo.type === PartType.PROPERTY ||
        partInfo.type === PartType.ATTRIBUTE ||
        partInfo.type === PartType.BOOLEAN_ATTRIBUTE
      )
    ) {
      throw new Error(
        'The `live` directive is not allowed on child or event bindings'
      );
    }
    if (!isSingleExpression(partInfo)) {
      throw new Error('`live` bindings can only contain a single expression');
    }
  }

  render(value: unknown, _equal?: EqualFn) {
    return value;
  }

  override update(
    part: AttributePart & {
      readonly type: ValidPartType;
    },
    [value, equal]: DirectiveParameters<this>
  ) {
    if (value === noChange || value === nothing) {
      return value;
    }
    const element = part.element as Element;
    const name = part.name;
    const _equal = equal ?? defaults[part.type];

    if (_equal(value, getValue[part.type](element, name))) return noChange;

    // Resets the part's value, causing its dirty-check to fail so that it
    // always sets the value.
    setCommittedValue(part);
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
 * ```js
 * html`<input .value=${live(x)}>`
 * ```
 *
 * `live()` performs a strict equality check against the live DOM value, and if
 * the new value is equal to the live value, does nothing. This means that
 * `live()` should not be used when the binding will cause a type conversion. If
 * you use `live()` with an attribute binding, make sure that only strings are
 * passed in, or the binding will update every render.
 *
 * To customize the equality check, you can pass in a function as the second
 * argument.
 *
 * ```js
 * const eqAsString = (value, elementValue) => String(value) === elementValue)
 * html`<input .value=${live(x, eqAsString}>`
 * ```
 */
export const live = directive(LiveDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type {LiveDirective};
