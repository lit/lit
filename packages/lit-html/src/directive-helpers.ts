/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {_Σ, Part, DirectiveParent, TemplateResult} from './lit-html.js';
import {
  DirectiveResult,
  DirectiveClass,
  PartInfo,
  AttributePartInfo,
} from './directive.js';
type Primitive = null | undefined | boolean | number | string | symbol | bigint;

const {_ChildPart: ChildPart} = _Σ;

type ChildPart = InstanceType<typeof ChildPart>;

const ENABLE_SHADYDOM_NOPATCH = true;

const wrap =
  ENABLE_SHADYDOM_NOPATCH &&
  window.ShadyDOM?.inUse &&
  window.ShadyDOM?.noPatch === true
    ? window.ShadyDOM!.wrap
    : (node: Node) => node;

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
export const isDirectiveResult = (value: unknown): value is DirectiveResult =>
  (value as DirectiveResult)?._$litDirective$ !== undefined;

/**
 * Retrieves the Directive class for a DirectiveResult
 */
export const getDirectiveClass = (value: unknown): DirectiveClass | undefined =>
  (value as DirectiveResult)?._$litDirective$;

/**
 * Tests whether a part has only a single-expression with no strings to
 * interpolate between.
 *
 * Only AttributePart and PropertyPart can have multiple expressions.
 * Multi-expression parts have a `strings` property and single-expression
 * parts do not.
 */
export const isSingleExpression = (part: PartInfo) =>
  (part as AttributePartInfo).strings === undefined;

const createMarker = () => document.createComment('');

/**
 * Inserts a ChildPart into the given container ChildPart's DOM, either at the
 * end of the container ChildPart, or before the optional `refPart`.
 *
 * This does not add the part to the containerPart's committed value. That must
 * be done by callers.
 *
 * @param containerPart Part within which to add the new ChildPart
 * @param refPart Part before which to add the new ChildPart; when omitted the
 *     part added to the end of the `containerPart`
 * @param part Part to insert, or undefined to create a new part
 */
export const insertPart = (
  containerPart: ChildPart,
  refPart?: ChildPart,
  part?: ChildPart
): ChildPart => {
  const container = wrap(containerPart._$startNode).parentNode!;

  const refNode =
    refPart === undefined ? containerPart._$endNode : refPart._$startNode;

  if (part === undefined) {
    const startNode = wrap(container).insertBefore(createMarker(), refNode);
    const endNode = wrap(container).insertBefore(createMarker(), refNode);
    part = new ChildPart(
      startNode,
      endNode,
      containerPart,
      containerPart.options
    );
  } else {
    const endNode = wrap(part._$endNode!).nextSibling;
    const parentChanged = part._$parent !== containerPart;
    if (parentChanged) {
      part._$reparentDisconnectables?.(containerPart);
      // Note that although `_$reparentDisconnectables` updates the part's
      // `_$parent` reference after unlinking from its current parent, that
      // method only exists if Disconnectables are present, so we need to
      // unconditionally set it here
      part._$parent = containerPart;
    }
    if (endNode !== refNode || parentChanged) {
      let start: Node | null = part._$startNode;
      while (start !== endNode) {
        const n: Node | null = wrap(start!).nextSibling;
        wrap(container).insertBefore(start!, refNode);
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
 * should extend `AsyncDirective` and call `this.setValue()`.
 *
 * @param part Part to set
 * @param value Value to set
 * @param index For `AttributePart`s, the index to set
 * @param directiveParent Used internally; should not be set by user
 */
export const setChildPartValue = <T extends ChildPart>(
  part: T,
  value: unknown,
  directiveParent: DirectiveParent = part
): T => {
  part._$setValue(value, directiveParent);
  return part;
};

// A sentinal value that can never appear as a part value except when set by
// live(). Used to force a dirty-check to fail and cause a re-render.
const RESET_VALUE = {};

/**
 * Sets the committed value of a ChildPart directly without triggering the
 * commit stage of the part.
 *
 * This is useful in cases where a directive needs to update the part such
 * that the next update detects a value change or not. When value is omitted,
 * the next update will be guaranteed to be detected as a change.
 *
 * @param part
 * @param value
 */
export const setCommittedValue = (part: Part, value: unknown = RESET_VALUE) =>
  (part._$committedValue = value);

/**
 * Returns the committed value of a ChildPart.
 *
 * The committed value is used for change detection and efficient updates of
 * the part. It can differ from the value set by the template or directive in
 * cases where the template value is transformed before being commited.
 *
 * - `TemplateResult`s are committed as a `TemplateInstance`
 * - Iterables are committed as `Array<ChildPart>`
 * - All other types are committed as the template value or value returned or
 *   set by a directive.
 *
 * @param part
 */
export const getCommittedValue = (part: ChildPart) => part._$committedValue;

/**
 * Removes a ChildPart from the DOM, including any of its content.
 *
 * @param part The Part to remove
 */
export const removePart = (part: ChildPart) => {
  part._$setChildPartConnected?.(false, true);
  let start: ChildNode | null = part._$startNode;
  const end: ChildNode | null = wrap(part._$endNode!).nextSibling;
  while (start !== end) {
    const n: ChildNode | null = wrap(start!).nextSibling;
    (wrap(start!) as ChildNode).remove();
    start = n;
  }
};

export const clearPart = (part: ChildPart) => {
  part._$clear();
};
