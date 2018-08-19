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

type PartCache = [NodePart, NodePart, DocumentFragment];
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
 * @param ifValue the content to render if
 * @param elseValue
 */
export const when = (condition: boolean, ifValue: () => any, elseValue: () => any): DirectiveFn<NodePart> =>
    directive((part: NodePart) => {
      // Create cache if this was the first render
      if (!partCaches.has(part)) {
        createPartCache(part);
      }

      const partCache = partCaches.get(part)!;
      const cacheContainer = partCache[2];
      const parts = [partCache[0], partCache[1]];
      let value;

      if (condition) {
        value = ifValue();
      } else {
        parts.reverse();
        value = elseValue();
      }

      const [newPart, prevPart] = parts;

      // If the new part was rendered, take it from the cache
      if (newPart.value) {
        part.startNode.parentNode!.appendChild(cacheContainer);
      }

      // If the old part was rendered, move it to the cache
      if (prevPart.value) {
        reparentNodes(cacheContainer, prevPart.startNode, prevPart.endNode.nextSibling);
      }

      // Set the new part's value
      newPart.setValue(value);
      newPart.commit();
    });

/**
 * Creates cache consisting of a NodePart for each condition and a
 * document fragment for caching nodes.
 *
 * @param parentPart the parent part
 */
function createPartCache(parentPart: NodePart) {
  const parts: PartCache =  [
    new NodePart(parentPart.templateFactory),
    new NodePart(parentPart.templateFactory),
    document.createDocumentFragment(),
  ];
  partCaches.set(parentPart, parts);

  parts[0].appendIntoPart(parentPart);
  parts[1].appendIntoPart(parentPart);
}