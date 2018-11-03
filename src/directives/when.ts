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

import {directive, NodePart, Part, reparentNodes} from '../lit-html.js';

interface PartCache {
  truePart: NodePart;
  falsePart: NodePart;
  prevCondition?: boolean;
  cacheContainer: DocumentFragment;
}

const partCaches = new WeakMap<NodePart, PartCache>();

/**
 * Efficiently switches between two templates based on the given condition. The
 * rendered content is cached, and re-used when switching conditions. Templates
 * are evaluated lazily, so the passed values must be functions.
 *
 * While this directive can render any regular part, it makes the most sense
 * when used with TemplateResult since most other values are dirty checked
 * already.
 *
 * Example:
 *
 * ```
 * let checked = false;
 *
 * html`
 *   when(checked, () => html`Checkmark is checked`, () => html`Checkmark is not
 * checked`);
 * `
 * ```
 *
 * @param condition the condition to test truthiness against
 * @param trueValue the value to render given a true condition
 * @param falseValue the value to render given a false condition
 */
export const when = directive(
    (condition: any, trueValue: () => any, falseValue: () => any) =>
        (parentPart: Part) => {
          if (!(parentPart instanceof NodePart)) {
            throw new Error('when can only be used in text bindings');
          }

          let cache = partCaches.get(parentPart);

          // Create a new cache if this is the first render
          if (cache === undefined) {
            // Cache consists of two parts, one for each condition, and a
            // docment fragment which we cache the nodes of the condition that's
            // not currently rendered.
            cache = {
              truePart: new NodePart(parentPart.options),
              falsePart: new NodePart(parentPart.options),
              cacheContainer: document.createDocumentFragment(),
              prevCondition: condition
            };
            partCaches.set(parentPart, cache);

            if (condition) {
              cache.truePart.appendIntoPart(parentPart);
              cache.falsePart.appendInto(cache.cacheContainer);
            } else {
              cache.falsePart.appendIntoPart(parentPart);
              cache.truePart.appendInto(cache.cacheContainer);
            }
          }

          // Based on the condition, select which part to render and which value
          // to set on that part.
          const nextPart = condition ? cache.truePart : cache.falsePart;
          const nextValue = condition ? trueValue() : falseValue();

          // If we switched condition, swap nodes to/from the cache.
          if (!!condition !== cache.prevCondition) {
            // Get the part which was rendered for the opposite condition. This
            // should be added to the cache.
            const prevPart = condition ? cache.falsePart : cache.truePart;

            // Take the next part from the cache
            parentPart.startNode.parentNode!.insertBefore(
                cache.cacheContainer, parentPart.startNode);

            // Move the prev part to the cache
            reparentNodes(
                cache.cacheContainer,
                prevPart.startNode,
                prevPart.endNode.nextSibling);
          }

          // Set the next part's value
          nextPart.setValue(nextValue);
          nextPart.commit();

          cache.prevCondition = !!condition;
        });
