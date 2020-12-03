import {AttributePart, NodePart, Part, nothing} from './lit-html.js';

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

export const detachNodePart = (part: NodePart): NodePartState => {
  const fragment = document.createDocumentFragment();
  const state: NodePartStateInternal = {
    _value: part._$value,
    _fragment: fragment,
  };
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

export const restoreNodePart = (part: NodePart, state: NodePartState) => {
  ((part as unknown) as NodePartInternal)._commitNode(
    (state as NodePartStateInternal)._fragment
  );
  part._$value = (state as NodePartStateInternal)._value;
};

const createMarker = () => document.createComment('');

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
  return new NodePart(startNode, endNode, containerPart.options);
};

export const setPartValue = <T extends Part>(
  part: T,
  value: unknown,
  index?: number
): T => {
  if ((part as AttributePart).strings !== undefined) {
    if (index === undefined) {
      throw new Error(
        "An index must be provided to set an AttributePart's value."
      );
    }
    const newValues = [...(part._$value as Array<unknown>)];
    newValues[index] = value;
    (part as AttributePart)._$setValue(newValues, 0);
  } else {
    part._$setValue(value);
  }
  return part;
};

export const getPartValue = (part: NodePart) => part._$value;

// A sentinal value that can never appear as a part value except when set by
// live(). Used to force a dirty-check to fail and cause a re-render.
const RESET_VALUE = {};

export const resetPartValue = (part: Part, value: unknown = RESET_VALUE) =>
  (part._$value = value);

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

export const removePart = (part: NodePart) => {
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
