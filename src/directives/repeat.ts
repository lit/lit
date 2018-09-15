/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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

import {TemplateResult} from '../lib/template-result.js';
import {createMarker, directive, Directive, NodePart, removeNodes, reparentNodes, TemplateFactory} from '../lit-html.js';

export type KeyFn<T> = (item: T) => any;
export type ItemTemplate<T> = (item: T, index: number) => any;

// Helper functions for manipulating parts
// TODO(kschaaf): Refactor into Part API?
const createAndInsertPart = (
    containerPart: NodePart,
    beforePart?: NodePart): NodePart => {
  const container = containerPart.startNode.parentNode as Node;
  const beforeNode = beforePart === undefined ? containerPart.endNode : beforePart.startNode;
  const startNode = container.insertBefore(createMarker(), beforeNode);
  container.insertBefore(createMarker(), beforeNode);
  const newPart = new NodePart(containerPart.templateFactory);
  newPart.insertAfterNode(startNode);
  return newPart;
}
const updatePart = (part: NodePart, result: TemplateResult) => {
  part.setValue(result);
  part.commit();
  return part;
}
const inserPartBefore = (
    containerPart: NodePart,
    part: NodePart,
    ref?: NodePart) => {
  const container = containerPart.startNode.parentNode as Node;
  const beforeNode = ref ? ref.startNode : containerPart.endNode;
  const endNode = part.endNode.nextSibling;
  if (endNode !== beforeNode) {
    reparentNodes(container, part.startNode, endNode, beforeNode);
  }
}
const removePart = (part: NodePart) => {
  removeNodes(
      part.startNode.parentNode!,
      part.startNode,
      part.endNode.nextSibling);
}

// Stores previous ordered list of  parts and map of key to index
const partListCache = new WeakMap<NodePart, (NodePart|null)[]>();
const keyListCache = new WeakMap<NodePart, unknown[]>();
const keyToIndexMapCache = new WeakMap<NodePart, Map<unknown, number>>();

export function repeat<T>(
    items: T[], keyFn: KeyFn<T>, template: ItemTemplate<T>):
    Directive<NodePart>;
export function repeat<T>(
    items: T[], template: ItemTemplate<T>): Directive<NodePart>;
export function repeat<T>(
    items: Iterable<T>,
    keyFnOrTemplate: KeyFn<T>|ItemTemplate<T>,
    template?: ItemTemplate<T>): Directive<NodePart> {
  let keyFn: KeyFn<T>;
  if (arguments.length === 2) {
    template = keyFnOrTemplate;
  } else if (arguments.length === 3) {
    keyFn = keyFnOrTemplate as KeyFn<T>;
  }

  return directive((containerPart: NodePart): void => {
    // Old part & key lists and key-to-index map is retrieved from the last
    // update (associated with the part created for this instance of the
    // directive)
    const oldParts = partListCache.get(containerPart) || [];
    const oldKeys = keyListCache.get(containerPart) || [];
    const oldKeyToIndexMap = keyToIndexMapCache.get(containerPart) || new Map();

    // New part list will be built up as we go (either reused from old parts or
    // created for new keys in this update). This is saved in partListCache
    // at the end of the update.
    const newParts: NodePart[] = [];

    // New result list is eagerly generated from items along with a parallel
    // array indicating its key, and a map from key back to index.  These are
    // also saved in respective caches at the end of the update.
    const newResults: TemplateResult[] = [];
    const newKeyToIndexMap: Map<any, number> = new Map();
    const newKeys: unknown[] = [];
    let index = 0;
    for (const item of items) {
      const key = keyFn ? keyFn(item) : index;
      if (newKeyToIndexMap.has(key)) {
        console.warn(`Duplicate key '${
            key}' detected in repeat; behavior is undefined.`);
      } else {
        newKeys[index] = key;
        newResults[index] = template!(item, index);
        newKeyToIndexMap.set(key, newKeyToIndexMap.size);
      }
      index++;
    }

    // Head and tail pointers to old parts and new results
    let oldHead = 0;
    let oldTail = oldParts.length - 1;
    let newHead = 0;
    let newTail = newResults.length - 1;

    // Overview of O(n) reconciliation algorithm (general approach based on
    // ideas found in ivi, vue, snabdom, etc.):
    //
    // * We start with the list of old parts and new results, head/tail pointers
    //   into each, and we build up the new list of parts by updating (and when
    //   needed, moving) old parts or creating new ones. The initial scenario
    //   might look like this:
    //
    //           oldHead v                 v oldTail
    //   oldParts:      [0, 1, 2, 3, 4, 5, 6]
    //   newParts:      [ ,  ,  ,  ,  ,  ,  ]
    //   newResults:    [0, 2, 1, 4, 3, 7, 6]
    //           newHead ^                 ^ newTail
    //
    // * Iterate old & new lists from both sides, updating, swapping, or
    //   removing parts at the head/tail locations until neither head nor tail
    //   can move
    //
    //           oldHead v                 v oldTail
    //   oldParts:      [0, 1, 2, 3, 4, 5, 6]
    //   newParts:      [0,  ,  ,  ,  ,  ,  ] <- heads matched: update 0
    //   newResults:    [0, 2, 1, 4, 3, 7, 6]
    //           newHead ^                 ^ newTail
    //
    //              oldHead v              v oldTail
    //   oldParts:      [0, 1, 2, 3, 4, 5, 6]
    //   newParts:      [0,  ,  ,  ,  ,  , 6] <- tails matched: update 6
    //   newResults:    [0, 2, 1, 4, 3, 7, 6]
    //              newHead ^              ^ newTail
    //
    //              oldHead v           v oldTail
    //   oldParts:      [0, 1, 2, 3, 4, 5, 6]
    //   newParts:      [0,  ,  ,  ,  ,  , 6] <- 5 not in new map; remove 5
    //   newResults:    [0, 2, 1, 4, 3, 7, 6]
    //              newHead ^           ^ newTail
    //
    // * Once head and tail cannot move, any mismatches are due to either new or
    //   moved items; if a new key is in the previous "old key to old index"
    //   map, find the old part and move it to the new location, otherwise
    //   create and insert a new part. Note that when moving an old part we
    //   null its position in the oldParts array if it lies between the head
    //   and tail so we know to skip it when the pointers get there.
    //
    //              oldHead v        v oldTail
    //   oldParts:      [0, 1, -, 3, 4, 5, 6]
    //   newParts:      [0, 2,  ,  ,  ,  , 6] <- stuck; update & move 2 into place
    //   newResults:    [0, 2, 1, 4, 3, 7, 6]
    //              newHead ^           ^ newTail
    //
    // * We always restart back from the top of the algorithm, allowing matching
    //   and simple updates in place to continue:
    //
    //              oldHead v        v oldTail
    //   oldParts:      [0, 1, -, 3, 4, 5, 6]
    //   newParts:      [0, 2, 1,  ,  ,  , 6] <- heads matched; update 1
    //   newResults:    [0, 2, 1, 4, 3, 7, 6]
    //                 newHead ^        ^ newTail
    //
    // * Items that were moved as a result of being stuck (the final else
    //   clause) are marked with null, so we always advance old pointers over
    //   these so we're comparing the next actual old value on either end.
    //
    //                 oldHead v     v oldTail
    //   oldParts:      [0, 1, -, 3, 4, 5, 6] // old head already used; advance
    //   newParts:      [0, 2, 1,  ,  ,  , 6]
    //   newResults:    [0, 2, 1, 4, 3, 7, 6]
    //                    newHead ^     ^ newTail
    //
    // * Note it's not critical to mark old parts as null when they are moved
    //   from head to tail or tail to head, since they will be outside the
    //   pointer range and never visited again.
    //
    //                    oldHead v  v oldTail
    //   oldParts:      [0, 1, -, 3, 4, 5, 6]
    //   newParts:      [0, 2, 1, 4,  ,  , 6] <- old tail matches new head: update
    //   newResults:    [0, 2, 1, 4, 3, 7, 6]    and move 4 into place
    //                    newHead ^     ^ newTail
    //
    //                    oldHead v oldTail
    //   oldParts:      [0, 1, -, 3, 4, 5, 6]
    //   newParts:      [0, 2, 1, 4, 3,   ,6] <- heads match: update 3
    //   newResults:    [0, 2, 1, 4, 3, 7, 6]
    //                       newHead ^  ^ newTail
    //
    // * If either the new or old pointers move past each other then all we have
    //   left is additions (if old list exhsusted) or removals (if new list
    //   exhausted). Those are handled in the final while loops at the end.
    //
    //                   (oldHead > oldTail)
    //   oldParts:      [0, 1, -, 3, 4, 5, 6]
    //   newParts:      [0, 2, 1, 4, 3, 7 ,6] <- create and insert 7
    //   newResults:    [0, 2, 1, 4, 3, 7, 6]
    //                          newHead ^ newTail
    //
    // * Note that for moves/insertions, a part inserted at the head pointer
    //   is inserted before the current `oldParts[oldHead]`, and a part inserted
    //   at the tail pointer is inserved before `newParts[newHead+1]`.
    //   The seeming asymetry lies in the fact that new parts are moved into
    //   place outside in, so to the right of the head pointer are old parts,
    //   and to the right of the tail pointer are new parts.
    //
    // * Note that the order of the if/else clauses is not important to the
    //   algorithm, as long as the null checks come first (to ensure we're
    //   always working on valid old parts) and that the final else clause
    //   comes last (since that's where the expensive moves occur). The
    //   order of remaining clauses is is just a simple guess at wich cases
    //   will be most common.
    //
    // * TODO(kschaaf) Note, we could calculate the longest increasing
    //   subsequence (LIS) of old items in new position, and only move those not
    //   in the LIS set. However that costs O(nlogn) time and adds a bit more
    //   code, and only helps make rare types of mutations require fewer moves.
    //   The above handles removes, adds, reversal, swaps, and single moves of
    //   contiguous items in linear time, in the minimum number of moves. As
    //   the number of multiple moves where LIS might help approaches a random
    //   shuffle, the LIS optimization becomes less helpful, so it seems not
    //   worth the code at this point, but could consider if a compelling case
    //   arises.

    while (oldHead <= oldTail && newHead <= newTail) {
      if (oldParts[oldHead] === null) {
        // `null` means old part at head has already been used below; skip
        oldHead++;
      } else if (oldParts[oldTail] === null) {
        // `null` means old part at tail has already been used below; skip
        oldTail--;
      } else if (oldKeys[oldHead] === newKeys[newHead]) {
        // Old head matches new head; update in place
        newParts[newHead] = updatePart(oldParts[oldHead]!, newResults[newHead]);
        oldHead++;
        newHead++;
      } else if (oldKeys[oldTail] === newKeys[newTail]) {
        // Old tail matches new tail; update in place
        newParts[newTail] = updatePart(oldParts[oldTail]!, newResults[newTail]);
        oldTail--;
        newTail--;
      } else if (!newKeyToIndexMap.has(oldKeys[oldHead])) {
        // Old head is no longer in new list; remove
        removePart(oldParts[oldHead]!);
        oldHead++;
      } else if (!newKeyToIndexMap.has(oldKeys[oldTail])) {
        // Old tail is no longer in new list; remove
        removePart(oldParts[oldTail]!);
        oldTail--;
      } else if (oldKeys[oldHead] === newKeys[newTail]) {
        // Old head matches new tail; update and move to new tail
        newParts[newTail] = updatePart(oldParts[oldHead]!, newResults[newTail]);
        inserPartBefore(containerPart, oldParts[oldHead]!, newParts[newTail+1]);
        oldHead++;
        newTail--;
      } else if (oldKeys[oldTail] === newKeys[newHead]) {
        // Old tail matches new head; update and move to new head
        newParts[newHead] = updatePart(oldParts[oldTail]!, newResults[newHead]);
        inserPartBefore(containerPart, oldParts[oldTail]!, oldParts[oldHead]!);
        oldTail--;
        newHead++;
      } else {
        // Any mismatches at this point are due to additions or moves; see if
        // we have an old part we can reuse and move into place
        const oldIndex = oldKeyToIndexMap.get(newKeys[newHead]);
        const oldPart = oldIndex !== undefined ? oldParts[oldIndex] : null;
        if (oldPart == null) {
          // No old part for this result; create a new one and insert it
          let newPart = createAndInsertPart(containerPart, oldParts[oldHead]!);
          updatePart(newPart, newResults[newHead]);
          newParts[newHead] = newPart;
        } else {
          // Reuse old part
          newParts[newHead] = updatePart(oldPart, newResults[newHead]);
          inserPartBefore(containerPart, oldPart, oldParts[oldHead]!);
          // This marks the old part as having been used, so that it will be
          // skipped in the first two checks above
          oldParts[oldIndex as number] = null;
        }
        newHead++;
      }
    }
    // Add parts for any remaining new results
    while (newHead <= newTail) {
      const newPart = createAndInsertPart(containerPart, oldParts[oldHead]!);
      updatePart(newPart, newResults[newHead]);
      newParts[newHead++] = newPart;
    }
    // Remove any remaining unused old parts
    while (oldHead <= oldTail) {
      const oldPart = oldParts[oldHead++];
      if (oldPart !== null) {
        removePart(oldPart);
      }
    }
    // Save order of new parts for next round
    partListCache.set(containerPart, newParts);
    keyListCache.set(containerPart, newKeys);
    keyToIndexMapCache.set(containerPart, newKeyToIndexMap);
  });
}
