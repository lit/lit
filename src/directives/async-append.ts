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

import {createMarker, directive, NodePart, Part} from '../lit-html.js';

/**
 * A directive that renders the items of an async iterable[1], appending new
 * values after previous values, similar to the built-in support for iterables.
 *
 * Async iterables are objects with a [Symbol.asyncIterator] method, which
 * returns an iterator who's `next()` method returns a Promise. When a new
 * value is available, the Promise resolves and the value is appended to the
 * Part controlled by the directive. If another value other than this
 * directive has been set on the Part, the iterable will no longer be listened
 * to and new values won't be written to the Part.
 *
 * [1]: https://github.com/tc39/proposal-async-iteration
 *
 * @param value An async iterable
 * @param mapper An optional function that maps from (value, index) to another
 *     value. Useful for generating templates for each item in the iterable.
 */
export const asyncAppend = directive(
    <T>(value: AsyncIterable<T>,
        mapper?: (v: T, index?: number) => unknown) => async (part: Part) => {
      if (!(part instanceof NodePart)) {
        throw new Error('asyncAppend can only be used in text bindings');
      }
      // If we've already set up this particular iterable, we don't need
      // to do anything.
      if (value === part.value) {
        return;
      }
      part.value = value;

      // We keep track of item Parts across iterations, so that we can
      // share marker nodes between consecutive Parts.
      let itemPart;
      let i = 0;

      for await (let v of value) {
        // Check to make sure that value is the still the current value of
        // the part, and if not bail because a new value owns this part
        if (part.value !== value) {
          break;
        }

        // When we get the first value, clear the part. This lets the
        // previous value display until we can replace it.
        if (i === 0) {
          part.clear();
        }

        // As a convenience, because functional-programming-style
        // transforms of iterables and async iterables requires a library,
        // we accept a mapper function. This is especially convenient for
        // rendering a template for each item.
        if (mapper !== undefined) {
          // This is safe because T must otherwise be treated as unknown by
          // the rest of the system.
          v = mapper(v, i) as T;
        }

        // Like with sync iterables, each item induces a Part, so we need
        // to keep track of start and end nodes for the Part.
        // Note: Because these Parts are not updatable like with a sync
        // iterable (if we render a new value, we always clear), it may
        // be possible to optimize away the Parts and just re-use the
        // Part.setValue() logic.

        let itemStartNode = part.startNode;

        // Check to see if we have a previous item and Part
        if (itemPart !== undefined) {
          // Create a new node to separate the previous and next Parts
          itemStartNode = createMarker();
          // itemPart is currently the Part for the previous item. Set
          // it's endNode to the node we'll use for the next Part's
          // startNode.
          itemPart.endNode = itemStartNode;
          part.endNode.parentNode!.insertBefore(itemStartNode, part.endNode);
        }
        itemPart = new NodePart(part.options);
        itemPart.insertAfterNode(itemStartNode);
        itemPart.setValue(v);
        itemPart.commit();
        i++;
      }
    });
