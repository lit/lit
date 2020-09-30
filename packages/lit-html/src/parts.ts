import {NodePart, nothing} from './lit-html.js';

/**
 * The state of a NodePart, which can be detached and reattached.
 */
export type NodePartState = {};

/**
 * The private interface for NodePartState, which should be kept opaque.
 */
type NodePartStateInternal = {
  __value: unknown;
  __fragment: DocumentFragment;
};

/**
 * Package private members of NodePart.
 */
type NodePartInternal = {
  _startNode: NodePart['_startNode'];
  _endNode: NodePart['_endNode'];
};

export const detachNodePart = (part: NodePart): NodePartState => {
  const fragment = document.createDocumentFragment();
  const state: NodePartStateInternal = {
    __value: part._value,
    __fragment: fragment,
  };
  let start = ((part as unknown) as NodePartInternal)._startNode.nextSibling;
  let nextNode;
  while (start !== ((part as unknown) as NodePartInternal)._endNode) {
    nextNode = start!.nextSibling;
    fragment.append(start!);
    start = nextNode;
  }
  part._value = nothing;
  return state;
};

export const restoreNodePart = (part: NodePart, state: NodePartState) => {
  // TODO (justinfagnani): make an interal-only interface
  (part as any).__commitNode((state as NodePartStateInternal).__fragment);
  part._value = (state as NodePartStateInternal).__value;
};

const createMarker = () => document.createComment('');

export const createAndInsertPart = (
  containerPart: NodePart,
  refPart?: NodePart
): NodePart => {
  const container = ((containerPart as unknown) as NodePartInternal)._startNode
    .parentNode as Node;

  const refNode =
    refPart === undefined
      ? ((containerPart as unknown) as NodePartInternal)._endNode
      : ((refPart as unknown) as NodePartInternal)._startNode;

  const startNode = container.insertBefore(createMarker(), refNode);
  const endNode = container.insertBefore(createMarker(), refNode);
  return new NodePart(startNode, endNode, containerPart.options);
};

export const setPartValue = (part: NodePart, value: unknown) => {
  part._setValue(value);
  return part;
};

export const getPartValue = (part: NodePart) => part._value;

export const insertPartBefore = (
  containerPart: NodePart,
  part: NodePart,
  refPart?: NodePart
) => {
  const container = ((containerPart as unknown) as NodePartInternal)._startNode
    .parentNode!;

  const refNode = refPart
    ? ((refPart as unknown) as NodePartInternal)._startNode
    : ((containerPart as unknown) as NodePartInternal)._endNode;

  const endNode = ((part as unknown) as NodePartInternal)._endNode!
    .nextSibling;

  if (endNode !== refNode) {
    reparentNodes(
      container,
      ((part as unknown) as NodePartInternal)._startNode,
      endNode,
      refNode
    );
  }
};

export const removePart = (part: NodePart) => {
  removeNodes(
    ((part as unknown) as NodePartInternal)._startNode,
    ((part as unknown) as NodePartInternal)._endNode!.nextSibling
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
