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

import { createMarker, directive, Directive, NodePart, removeNodes, reparentNodes, TemplateFactory } from '../lit-html.js';
import { TemplateResult } from '../lib/template-result.js';

export type KeyFn<T> = (item: T) => any;
export type ItemTemplate<T> = (item: T, index: number) => any;

// Extension of NodePart to add concept of keying
// TODO(kschaaf): Should keying be part of part API?
class KeyedNodePart extends NodePart {
  key: any;
  constructor(templateFactory: TemplateFactory, key: any ) {
    super(templateFactory);
    this.key = key;
  }
}

// Extension of TemplateResult to add concept of keying
// TODO(kschaaf): Should keying be part of the base template result interface?
// TODO(kschaaf): Since we don't create the result, for now just adding an
// expando; consider using a WeakMap instead?
interface KeyedTemplateResult extends TemplateResult {
  key: any;
}

// Helper functions for manipulating parts
// TODO(kschaaf): Refactor into Part API?
function createPart(parentPart: NodePart, result: KeyedTemplateResult,
  beforePart?: NodePart | null): KeyedNodePart {
  const container = parentPart.startNode.parentNode as Node;
  const beforeNode = beforePart ? beforePart.startNode : parentPart.endNode;
  const startNode = createMarker();
  const endNode = createMarker();
  container.insertBefore(startNode, beforeNode);
  container.insertBefore(endNode, beforeNode);
  const newPart = new KeyedNodePart(parentPart.templateFactory, result.key);
  newPart.insertAfterNode(startNode);
  updatePart(newPart, result);
  return newPart;
}
function updatePart(part: KeyedNodePart, result: TemplateResult) {
  part.setValue(result);
  part.commit();
  return part;
}
function movePart(parentPart: NodePart, partToMove: NodePart, beforePart: NodePart | null | undefined) {
  const container = parentPart.startNode.parentNode as Node;
  const beforeNode = beforePart ? beforePart.startNode : parentPart.endNode;
  const endNode = partToMove.endNode.nextSibling;
  if (endNode !== beforeNode) {
    reparentNodes(container, partToMove.startNode, endNode, beforeNode);
  }
}
function removePart(part: NodePart) {
  removeNodes(part.startNode.parentNode as Node, part.startNode, part.endNode.nextSibling);
}

// Stores previous ordered list of keyed parts and map of key to index
const partListCache = new WeakMap<NodePart, Array<KeyedNodePart|null>>();
const partMapCache = new WeakMap<NodePart, Map<any, number>>();

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
  if (arguments.length < 3) {
    template = keyFnOrTemplate;
  } else {
    keyFn = keyFnOrTemplate as KeyFn<T>;
  }

  return directive((directivePart: NodePart): void => {

    // Old part list & map is retrieved from the last render (associated with
    // the part created for this instance of the directive)
    let oldParts = partListCache.get(directivePart) || [];
    let oldKeyToIndexMap = partMapCache.get(directivePart) || new Map();

<<<<<<< HEAD
    // New part list will be built up as we go (either reused from old parts or
    // created for new keys in this update). This is saved in partListCache
    // at the end of the update.
    const newParts: Array<KeyedNodePart> = [];
    const newKeyToIndexMap: Map<any, number> = new Map();

    // New result list is eagerly generated from items and marked with its key.
    // This is saved in partMapCache at the end of the update.
    const newResults: Array<KeyedTemplateResult> = [];
    let index = 0;
    for (let item of items) {
      const key = keyFn ? keyFn(item) : index;
      if (newKeyToIndexMap.has(key)) {
        console.warn(`Duplicate key '${key}' detected in repeat; behavior is undefined.`);
=======
      // Try to reuse a part
      let itemPart = keyMap.get(key);
      if (itemPart === undefined) {
        // TODO(justinfagnani): We really want to avoid manual marker creation
        // here and instead use something like part.insertBeforePart(). This
        // requires a little refactoring, like iterating through values and
        // existing parts like NodePart#_setIterable does. We can also remove
        // keyMapCache and use part._value instead.
        // But... repeat() is badly in need of rewriting, so we'll do this for
        // now and revisit soon.
        const marker = createMarker();
        const endNode = createMarker();
        container.insertBefore(marker, currentMarker);
        container.insertBefore(endNode, currentMarker);
        itemPart = new NodePart(part.templateFactory);
        itemPart.insertAfterNode(marker);
        if (key !== undefined) {
          keyMap.set(key, itemPart);
        }
      } else if (currentMarker !== itemPart.startNode) {
        // Existing part in the wrong position
        const end = itemPart.endNode.nextSibling!;
        if (currentMarker !== end) {
          reparentNodes(container, itemPart.startNode, end, currentMarker);
        }
>>>>>>> master
      } else {
        const result = newResults[index] = template !(item, index);
        newKeyToIndexMap.set(key, index);
        result.key = key;
        index++;
      }
    }

    // Head and tail pointers to old parts and new results
    let oldStartIndex = 0;
    let oldStartPart = oldParts[0];    
    let oldEndIndex = oldParts.length-1;
    let oldEndPart = oldParts[oldEndIndex];
    let newStartIndex = 0;
    let newStartResult = newResults[0];
    let newEndIndex = newResults.length-1;
    let newEndResult = newResults[newEndIndex];

    // Overview of O(n) reconciliation algorithm (general approach based on
    // ideas found in ivi, vue, snabdom, etc.): 
    // * Iterate old & new lists from both sides, updating, swapping, or removing
    //   items at the head/tail locations until neither head nor tail can move
    // * Once head and tail cannot move, any mismatches are due to either new or
    //   moved items; create and insert new items, or else move old part to new
    //   position using the "old key to old index" map.
    // * If either the new or old pointers move past each other then all we have
    //   left is additions (if old list exhsusted) or removals (if new list
    //   exhausted). Those are handled in the final while loops at the end.
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
    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
      if (oldStartPart == null) {
        // Old part at head has already been used; skip
        oldStartPart = oldParts[++oldStartIndex];
      } else if (oldEndPart == null) {
        // Old part at tail has already been used; skip
        oldEndPart = oldParts[--oldEndIndex];
      } else if (oldStartPart.key == newStartResult.key) {
        // Old head matches new head; update in place
        newParts[newStartIndex] = updatePart(oldStartPart, newStartResult);  
        oldStartPart = oldParts[++oldStartIndex];
        newStartResult = newResults[++newStartIndex];
      } else if (oldEndPart.key == newEndResult.key) {
        // Old tail matches new tail; update in place
        newParts[newEndIndex] = updatePart(oldEndPart, newEndResult);
        oldEndPart = oldParts[--oldEndIndex];
        newEndResult = newResults[--newEndIndex];
      } else if (!newKeyToIndexMap.has(oldStartPart.key)) {
        // Old head is no longer in new list; remove
        removePart(oldStartPart);
        oldStartPart = oldParts[++oldStartIndex];
      } else if (!newKeyToIndexMap.has(oldEndPart.key)) {
        // Old tail is no longer in new list; remove
        removePart(oldEndPart);
        oldEndPart = oldParts[--oldEndIndex];
      } else if (oldStartPart.key == newEndResult.key) {
        // Old head matches new tail; update and move to new tail
        newParts[newEndIndex] = updatePart(oldStartPart, newEndResult);
        movePart(directivePart, oldStartPart, newParts[newEndIndex+1]);
        oldStartPart = oldParts[++oldStartIndex];
        newEndResult = newResults[--newEndIndex];
      } else if (oldEndPart.key == newStartResult.key) {
        // Old tail matches new head; update and move to new head
        newParts[newStartIndex] = updatePart(oldEndPart, newStartResult);
        movePart(directivePart, oldEndPart, oldStartPart);
        oldEndPart = oldParts[--oldEndIndex];
        newStartResult = newResults[++newStartIndex];
      } else {
        // Any mismatches at this point are due to additions or moves; see if
        // we have an old part we can reuse and move into place
        const oldIndex = oldKeyToIndexMap.get(newEndResult.key);
        const oldPart = oldIndex !== undefined ? oldParts[oldIndex] : null;
        if (oldPart == null) {
          // No old part for this result; create a new one and insert it
          let newPart = createPart(directivePart, newEndResult, newParts[newEndIndex+1]);
          newParts[newEndIndex] = newPart;
        } else {
          // Reuse old part
          newParts[newEndIndex] = updatePart(oldPart, newEndResult);
          movePart(directivePart, oldPart, newParts[newEndIndex+1]);
          // This marks the old part as having been used, so that it will be 
          // skipped in the first two checks above
          oldParts[oldIndex as number] = null;
        }
        newEndResult = newResults[--newEndIndex];
      }
    }
    // Add parts for any remaining new results
    while (newStartIndex <= newEndIndex) {
      const newPart = createPart(directivePart, newStartResult, oldStartPart);
      newParts[newStartIndex] = newPart;
      newStartResult = newResults[++newStartIndex];
    }
    // Remove any remaining unused old parts
    while (oldStartIndex <= oldEndIndex) {
      if (oldStartPart != null) {
        removePart(oldStartPart);
      }
      oldStartPart = oldParts[++oldStartIndex];
    }
    // Save order of new parts for next round
    partListCache.set(directivePart, newParts);
    partMapCache.set(directivePart, newKeyToIndexMap);

  });
}
