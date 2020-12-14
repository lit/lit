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
  AttributePart,
  ChildPart,
  Part,
  DirectiveParent,
  TemplateResult,
} from './lit-html.js';
import {DirectiveResult, DirectiveClass} from './directive.js';
type Primitive = null | undefined | boolean | number | string | symbol | bigint;

/**
 * Tests if a value is a primitive value.
 *
 * See https://tc39.github.io/ecma262/#sec-typeof-operator
 */
export const isPrimitive = (value: unknown): value is Primitive =>
  value === null || (typeof value != 'object' && typeof value != 'function');

export const TemplateResultType = {
  HTML: 1,
  SVG: 2,
} as const;

export type TemplateResultType = typeof TemplateResultType[keyof typeof TemplateResultType];

/**
 * Tests if a value is a TemplateResult.
 */
export const isTemplateResult = (
  value: unknown,
  type?: TemplateResultType
): value is TemplateResult =>
  type === undefined
    ? (value as TemplateResult)?._$litType$ !== undefined
    : (value as TemplateResult)?._$litType$ === type;

/**
 * Tests if a value is a DirectiveResult.
 */
export const isDirectiveResult = (
  value: unknown,
  klass?: DirectiveClass
): value is DirectiveResult =>
  klass === undefined
    ? (value as DirectiveResult)?._$litDirective$ !== undefined
    : (value as DirectiveResult)?._$litDirective$ === klass;

const createMarker = () => document.createComment('');

/**
 * Inserts a ChildPart into the given container ChildPart's DOM, either at the
 * end of the container ChildPart, or before the optional `refPart`.
 *
 * This does not add the part to the containerPart's comitted value. That must
 * be done by callers.
 *
 * @param containerPart Part within which to add the new ChildPart
 * @param refPart Part before which to add the new ChildPart; when omitted the
 *     part added to the end of the `containerPart`
 * @param part Part to insert, or undefined to create a new part
 */
export const insertPart = (
  containerPart: ChildPart,
  refPart: ChildPart | undefined,
  part?: ChildPart
): ChildPart => {
  const container = containerPart._$startNode.parentNode!;

  const refNode =
    refPart === undefined ? containerPart._$endNode : refPart._$startNode;

  if (part === undefined) {
    const startNode = container.insertBefore(createMarker(), refNode);
    const endNode = container.insertBefore(createMarker(), refNode);
    part = new ChildPart(
      startNode,
      endNode,
      containerPart,
      containerPart.options
    );
  } else {
    const endNode = part._$endNode!.nextSibling;
    if (endNode !== refNode) {
      let start: Node | null = part._$startNode;
      while (start !== endNode) {
        const n: Node | null = start!.nextSibling;
        container.insertBefore(start!, refNode);
        start = n;
      }
    }
  }

  return part;
};

/**
 * Sets the value of a Part.
 *
 * Note that this should only be used to set/update the value of user-created
 * parts (i.e. those created using `insertPart`); it should not be used
 * by directives to set the value of the directive's container part. Directives
 * should return a value from `update`/`render` to update their part state.
 *
 * For directives that require setting their part value asynchronously, they
 * should extend `DisconnectableDirective` and call `this.setValue()`.
 *
 * @param part Part to set
 * @param value Value to set
 * @param index For `AttributePart`s, the index to set
 * @param directiveParent Used internally; should not be set by user
 */
export const setPartValue = <T extends Part>(
  part: T,
  value: unknown,
  index?: number,
  directiveParent: DirectiveParent = part
): T => {
  if ((part as AttributePart).strings !== undefined) {
    if (index === undefined) {
      throw new Error(
        "An index must be provided to set an AttributePart's value."
      );
    }
    const newValues = [...(part._$value as Array<unknown>)];
    newValues[index] = value;
    (part as AttributePart)._$setValue(newValues, directiveParent, 0);
  } else {
    part._$setValue(value, directiveParent);
  }
  return part;
};

// A sentinal value that can never appear as a part value except when set by
// live(). Used to force a dirty-check to fail and cause a re-render.
const RESET_VALUE = {};

/**
 * Resets the stored state of a ChildPart used for dirty-checking and
 * efficiently updating the part to the given value, or when omitted, to a state
 * where any subsequent dirty-check is guaranteed to fail, causing the next
 * commit to take effect.
 *
 * @param part
 * @param value
 */
export const resetPartValue = (part: Part, value: unknown = RESET_VALUE) =>
  (part._$value = value);

/**
 * Returns the stored state of a ChildPart used for dirty-checking and
 * efficiently updating the part. Note that this value can differ from the value
 * set by the user/directive, and varies by type:
 *
 * - For `TemplateResult`: returns a `TemplateInstance`
 * - For iterable, returns a `ChildPart[]`
 * - For all other types, returns the user value or resolved directive value
 *
 * TODO: this needs a better name, to disambiguate it from values set by user.
 *
 * @param part
 */
export const getPartValue = (part: ChildPart) => part._$value;

/**
 * Removes a ChildPart from the DOM, including any of its content.
 *
 * @param part The Part to remove
 */
export const removePart = (part: ChildPart) => {
  part._$setChildPartConnected?.(false, true);
  let start: ChildNode | null = part._$startNode;
  const end: ChildNode | null = part._$endNode!.nextSibling;
  while (start !== end) {
    const n: ChildNode | null = start!.nextSibling;
    start!.remove();
    start = n;
  }
};

export const clearPart = (part: ChildPart) => {
  part._$clear();
};
