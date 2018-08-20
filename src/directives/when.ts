/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

import {directive, reparentNodes, Directive, NodePart} from '../lit-html.js';

interface PartCache {
  truePart: NodePart;
  falsePart: NodePart;
  prevCondition?: boolean;
  cacheContainer: DocumentFragment;
}

const partCaches = new WeakMap<NodePart, PartCache>();

/**
 * Efficiently switches between two templates based on the given condition. The rendered
 * content is cached, and re-used when switching conditions. Templates are evaluated
 * lazily, so the passed values must be functions.
 *
 * While this directive can render any regular part, it makes the most sense when used
 * with TemplateResulte since most other values are dirty checked already.
 *
 * Example:
 *
 * let checked = false;
 *
 * html`
 *   when(checked, () => html`Checkmark is checked`, () => html`Checkmark is not checked`);
 * `
 *
 * @param condition the condition to test against
 * @param trueValue the value to render given a true condition
 * @param falseValue the value to render given a false condition
 */
export const when = (condition: boolean, trueValue: () => any, falseValue: () => any): Directive<NodePart> =>
    directive((part: NodePart) => {
      const partCache = getPartCache(part);
      const { truePart, falsePart, cacheContainer, prevCondition } = partCache;

      const nextPart = condition ? truePart : falsePart;
      const nextValue = condition ? trueValue() : falseValue();

      // Swap nodes if condition changed from previous
      if (condition !== prevCondition) {
        const prevPart = condition ? falsePart : truePart;
        // If the next part was rendered, take it from the cache
        if (nextPart.value) {
          part.startNode.parentNode!.appendChild(cacheContainer);
        }

        // If the prev part was rendered, move it to the cache
        if (prevPart.value) {
          reparentNodes(cacheContainer, prevPart.startNode, prevPart.endNode.nextSibling);
        }
      }

      // Set the next part's value
      nextPart.setValue(nextValue);
      nextPart.commit();

      partCache.prevCondition = condition;
    });

/**
 * @param parentPart the parent part
 * @returns the cache for the given parent. creates a new cache if none exists
 */
function getPartCache(parentPart: NodePart) {
  let cache = partCaches.get(parentPart);

  // Create a new cache if this is the first render
  if (!cache) {
    cache = {
      truePart: new NodePart(parentPart.templateFactory),
      falsePart: new NodePart(parentPart.templateFactory),
      cacheContainer: document.createDocumentFragment(),
    };
    partCaches.set(parentPart, cache);

    cache.truePart.appendIntoPart(parentPart);
    cache.falsePart.appendIntoPart(parentPart);
  }

  return cache;
}