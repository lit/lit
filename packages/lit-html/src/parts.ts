import { NodePart, nothing } from './lit-html.js';

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

export const detachNodePart = (part: NodePart): NodePartState => {
  const fragment = document.createDocumentFragment();
  const state: NodePartStateInternal = {
    __value: part.__value,
    __fragment: fragment,
  };
  let start = part.__startNode.nextSibling;
  let nextNode;
  while (start !== part.__endNode) {
    nextNode = start!.nextSibling;
    fragment.append(start!);
    start = nextNode;
  }
  part.__value = nothing;
  return state;
};

export const restoreNodePart = (part: NodePart, state: NodePartState) => {
  // TODO (justinfagnani): make an interal-only interface
  (part as any).__commitNode((state as NodePartStateInternal).__fragment);
  part.__value = (state as NodePartStateInternal).__value;
};

const createMarker = () => document.createComment('');

export const createAndInsertPart = (
  containerPart: NodePart,
  refPart?: NodePart
): NodePart => {
  const container = containerPart.__startNode.parentNode as Node;

  const endNode =
    refPart === undefined ? containerPart.__endNode : refPart.__startNode;

  const startNode = container.insertBefore(createMarker(), endNode);

  container.insertBefore(createMarker(), endNode);
  const newPart = new NodePart(startNode, endNode, containerPart.options);
  return newPart;
};

export const updatePart = (part: NodePart, value: unknown) => {
  part.__setValue(value);
  return part;
};

export const assertNodeMakers = (part: NodePart) => {
  let start = part.__startNode;
  let end = part.__endNode;

  if (start === null) {
    throw new Error('invalid startNode');
  }
  if (end === null) {
    return; // fine?
  }
  while (start !== end) {
    if (start.nextSibling === null) {
      throw new Error('endNode not a sucessor sibling of startNode');
    }
    start = start.nextSibling
  }
};

export const insertPartBefore = (
  containerPart: NodePart,
  part: NodePart,
  refPart?: NodePart
) => {
  console.log('insertPartBefore');
  const container = containerPart.__startNode.parentNode!;

  const refNode = refPart ? refPart.__startNode : containerPart.__endNode;

  const endNode = part.__endNode!.nextSibling;

  if (endNode !== refNode) {
    assertNodeMakers(part);
    // console.log({startNode: part.__startNode, endNode, refNode});
    reparentNodes(container, part.__startNode, endNode, refNode);
  }
};

export const removePart = (part: NodePart) => {
  removeNodes(
    part.__startNode.parentNode!,
    part.__startNode,
    part.__endNode!.nextSibling
  );
};

/**
 * Reparents nodes, starting from `start` (inclusive) to `end` (exclusive),
 * into another container (could be the same container), before `before`. If
 * `before` is null, it appends the nodes to the container.
 */
export const reparentNodes =
    (container: Node,
     start: Node|null,
     end: Node|null = null,
     before: Node|null = null): void => {
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
export const removeNodes =
  (container: Node, start: Node|null, end: Node|null = null): void => {
    while (start !== end) {
      const n = start!.nextSibling;
      container.removeChild(start!);
      start = n;
    }
  };
