import { NodePart } from './lit-html.js';
/**
 * The state of a NodePart, which can be detached and reattached.
 */
export declare type NodePartState = {};
export declare const detachNodePart: (part: NodePart) => NodePartState;
export declare const restoreNodePart: (part: NodePart, state: NodePartState) => void;
export declare const createAndInsertPart: (containerPart: NodePart, refPart?: NodePart | undefined) => NodePart;
export declare const updatePart: (part: NodePart, value: unknown) => NodePart;
export declare const insertPartBefore: (containerPart: NodePart, part: NodePart, refPart?: NodePart | undefined) => void;
export declare const removePart: (part: NodePart) => void;
/**
 * Reparents nodes, starting from `start` (inclusive) to `end` (exclusive),
 * into another container (could be the same container), before `before`. If
 * `before` is null, it appends the nodes to the container.
 */
export declare const reparentNodes: (container: Node, start: Node | null, end?: Node | null, before?: Node | null) => void;
/**
 * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
 * `container`.
 */
export declare const removeNodes: (start: ChildNode | null, end?: ChildNode | null) => void;
//# sourceMappingURL=parts.d.ts.map