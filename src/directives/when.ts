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

type PartCache = [NodePart, NodePart, Node];
const partCaches = new WeakMap<NodePart, PartCache>();

/**
 * Efficiently switches between two templates based on the given condition. The rendered
 * content is cached, and re-used when switching conditions.
 *
 * While this directive can render any regular part, it makes the most sense when used
 * with TemplateResulte since most other values are dirty checked already.
 *
 * Example:
 *
 * let checked = false;
 *
 * html`
 *   when(checked, html`Checkmark is checked`, html`Checkmark is not checked`);
 * `
 *
 * @param condition the condition to test against
 * @param ifValue the content to render if
 * @param elseValue
 */
export const when = (condition: boolean, ifValue: any, elseValue: any): Directive<NodePart> =>
    directive((part: NodePart) => {
      // Create cache if this was the first render
      if (!partCaches.has(part)) {
        createPartCache(part);
      }

      const partCache = partCaches.get(part)!;
      const cacheContainer = partCache[2];
      const parts = [partCache[0], partCache[1]];
      // The value to set. defaults to the if value.
      let value = ifValue;

      // If condition is false, set the else value and reverse parts so that the correct part is made active
      if (!condition) {
        parts.reverse();
        value = elseValue;
      }

      const [newPart, oldPart] = parts;

      // If the old part was rendered, reparent it to a detached container cache
      if (oldPart.value) {
        reparentNodes(cacheContainer, oldPart.startNode, oldPart.endNode.nextSibling);
      }

      // If the new part was rendered, reparent it inside the attached part
      if (newPart.value) {
        reparentNodes(part.startNode.parentNode!, newPart.startNode, newPart.endNode.nextSibling);
      }

      // Set the new part's value
      newPart.setValue(value);
      newPart.commit();
    });

/**
 * Creates cache consisting of a NodePart for each condition and a detached
 * container used for caching rendered nodes.
 *
 * @param parentPart the parent part
 */
function createPartCache(parentPart: NodePart) {
  const parts: PartCache =  [
    new NodePart(parentPart.templateFactory),
    new NodePart(parentPart.templateFactory),
    document.createElement('div'),
  ];
  partCaches.set(parentPart, parts);

  parts[0].appendIntoPart(parentPart);
  parts[1].appendIntoPart(parentPart);
}