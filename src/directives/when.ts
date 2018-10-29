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

import {NodePart, reparentNodes} from '../lit-html.js';
import {createDirective, forNodePart } from '../lib/createDirective.js';

interface PartCache {
  truePart: NodePart;
  falsePart: NodePart;
  prevCondition?: boolean;
  cacheContainer: DocumentFragment;
}

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
export const when = createDirective(forNodePart(
  (parentPart: NodePart) => {
    // Cache consists of two parts, one for each condition, and a
    // docment fragment which we cache the nodes of the condition that's
    // not currently rendered.
    const cache: PartCache = {
      truePart: new NodePart(parentPart.options),
      falsePart: new NodePart(parentPart.options),
      cacheContainer: document.createDocumentFragment(),
    };
    cache.truePart.appendIntoPart(parentPart);
    cache.falsePart.appendIntoPart(parentPart);

    return (condition: any, trueValue: () => any, falseValue: () => any) => {
      // Based on the condition, select which part to render and which value
      // to set on that part.
      const nextPart = condition ? cache.truePart : cache.falsePart;
      const nextValue = condition ? trueValue() : falseValue();

      // If we switched condition, swap nodes to/from the cache.
      if (!!condition !== cache.prevCondition) {
        // Get the part which was rendered for the opposite condition. This
        // should be added to the cache.
        const prevPart = condition ? cache.falsePart : cache.truePart;

        // If the next part was rendered, take it from the cache
        if (nextPart.value) {
          parentPart.startNode.parentNode!.appendChild(cache.cacheContainer);
        }

        // If the prev part was rendered, move it to the cache
        if (prevPart.value) {
          reparentNodes(
              cache.cacheContainer,
              prevPart.startNode,
              prevPart.endNode.nextSibling);
        }
      }

      // Set the next part's value
      nextPart.commitValue(nextValue);

      cache.prevCondition = !!condition;
    }
  }));
