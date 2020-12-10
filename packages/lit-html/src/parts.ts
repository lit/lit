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
  NodePart,
  Part,
  nothing,
  DirectiveParent,
} from './lit-html.js';

/**
 * The state of a NodePart, which can be detached and reattached.
 */
export type NodePartState = {};

/**
 * The private interface for NodePartState, which should be kept opaque.
 */
type NodePartStateInternal = {
  _value: unknown;
  _fragment: DocumentFragment;
};

/**
 * Package private members of NodePart.
 */
type NodePartInternal = {
  _$startNode: NodePart['_$startNode'];
  _$endNode: NodePart['_$endNode'];
  _commitNode: NodePart['_commitNode'];
};

/**
 * Detaches the DOM associated with a NodePart and returns an opaque
 * NodePartState object containing the previous state of the part, such that it
 * can be restored at a later time.
 *
 * @param part The NodePart to detach
 */
export const detachNodePart = (part: NodePart): NodePartState => {
  const fragment = document.createDocumentFragment();
  const state: NodePartStateInternal = {
    _value: part._$value,
    _fragment: fragment,
  };
  part._$setNodePartConnected?.(false, true);
  let start = ((part as unknown) as NodePartInternal)._$startNode.nextSibling;
  let nextNode;
  while (start !== ((part as unknown) as NodePartInternal)._$endNode) {
    nextNode = start!.nextSibling;
    fragment.append(start!);
    start = nextNode;
  }
  part._$value = nothing;
  return state;
};

/**
 * Restores the state of a previously detached NodePart, including re-attaching
 * its DOM and setting up the NodePart to efficiently update based on its
 * previously committed value.
 *
 * @param part The NodePart to restore
 * @param state The state restore, returned from a prior call to
 *     `detachNodePart`
 */
export const restoreNodePart = (part: NodePart, state: NodePartState) => {
  ((part as unknown) as NodePartInternal)._commitNode(
    (state as NodePartStateInternal)._fragment
  );
  part._$value = (state as NodePartStateInternal)._value;
  part._$setNodePartConnected?.(true);
};

const createMarker = () => document.createComment('');

/**
 * Creates a NodePart within a container NodePart, and inserts it into the DOM,
 * either at the end of the container NodePart, or before the optional
 * `refPart`.
 *
 * @param containerPart Part within which to add the new NodePart
 * @param refPart Part before which to add the new NodePart; when omitted the
 *     part added to the end of the `containerPart`
 */
export const createAndInsertPart = (
  containerPart: NodePart,
  refPart?: NodePart
): NodePart => {
  const container = ((containerPart as unknown) as NodePartInternal)._$startNode
    .parentNode as Node;

  const refNode =
    refPart === undefined
      ? ((containerPart as unknown) as NodePartInternal)._$endNode
      : ((refPart as unknown) as NodePartInternal)._$startNode;

  const startNode = container.insertBefore(createMarker(), refNode);
  const endNode = container.insertBefore(createMarker(), refNode);
  return new NodePart(startNode, endNode, containerPart, containerPart.options);
};

/**
 * Sets the value of a Part.
 *
 * Note that this should only be used to set/update the value of user-created
 * parts (i.e. those created using `createAndInsertPart`); it should not be used
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
 * Resets the stored state of a NodePart used for dirty-checking and
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
 * Returns the stored state of a NodePart used for dirty-checking and
 * efficiently updating the part. Note that this value can differ from the value
 * set by the user/directive, and varies by type:
 *
 * - For `TemplateResult`: returns a `TemplateInstance`
 * - For iterable, returns a `NodePart[]`
 * - For all other types, returns the user value or resolved directive value
 *
 * TODO: this needs a better name, to disambiguate it from values set by user.
 *
 * @param part
 */
export const getPartValue = (part: NodePart) => part._$value;

/**
 * Inserts (or moves) a NodePart in the DOM, within the given `containerPart`
 * and before the given `refPart`. If no `refPart` is provided, the part is
 * inserted at the end of the `containerPart`.
 *
 * @param containerPart Part within which to insert the NodePart
 * @param part Part to insert
 * @param refPart Part before which to add the new NodePart; when omitted the
 *     part added to the end of the `containerPart`
 */
export const insertPartBefore = (
  containerPart: NodePart,
  part: NodePart,
  refPart?: NodePart
) => {
  const container = ((containerPart as unknown) as NodePartInternal)._$startNode
    .parentNode!;

  const refNode = refPart
    ? ((refPart as unknown) as NodePartInternal)._$startNode
    : ((containerPart as unknown) as NodePartInternal)._$endNode;

  const endNode = ((part as unknown) as NodePartInternal)._$endNode!
    .nextSibling;

  if (endNode !== refNode) {
    reparentNodes(
      container,
      ((part as unknown) as NodePartInternal)._$startNode,
      endNode,
      refNode
    );
  }
};

/**
 * Removes a NodePart from the DOM, including any of its content.
 *
 * @param part The Part to remove
 */
export const removePart = (part: NodePart) => {
  part._$setNodePartConnected?.(false, true);
  removeNodes(
    ((part as unknown) as NodePartInternal)._$startNode,
    ((part as unknown) as NodePartInternal)._$endNode!.nextSibling
  );
};

/**
 * Reparents nodes, starting from `start` (inclusive) to `end` (exclusive),
 * into another container (could be the same container), before `before`. If
 * `before` is null, it appends the nodes to the container.
 */
const reparentNodes = (
  container: Node,
  start: Node | null,
  end: Node | null = null,
  before: Node | null = null
): void => {
  while (start !== end) {
    const n = start!.nextSibling;
    container.insertBefore(start!, before);
    start = n;
  }
};

/**
 * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
 * `container`.
 */
const removeNodes = (
  start: ChildNode | null,
  end: ChildNode | null = null
): void => {
  while (start !== end) {
    const n = start!.nextSibling;
    start!.remove();
    start = n;
  }
};
