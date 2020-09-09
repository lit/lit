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
