/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved.
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

import { ChildPart } from "./directive.js";
import { TemplateResult } from "./lit-html.js";

/**
 * Tests if a value is a TemplateResult.
 */
export const isTemplateResult = (value: unknown): value is TemplateResult =>
  value instanceof TemplateResult;

/**
 * Yields all toplevel nodes inside the dom range managed by the ChildPart.
 *
 * So if the ChildPart has rendered:
 *     html`<label><input></label> <div></div>`
 *
 * This function will yield the label and the div, but not the input.
 */
export function getRenderedNodes(childPart: ChildPart) {
  const results = [];
  const impl = childPart;
  const part = impl.legacyPart;
  for (
    let node: Node | null = part.startNode;
    node && node !== part.endNode;
    node = node.nextSibling
  ) {
    const n: Node = node;
    results.push(n);
  }
  return results;
}
