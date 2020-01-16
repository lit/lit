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

import {reparentNodes} from '../lib/dom.js';
import {isPrimitive} from '../lib/parts.js';
import {directive, NodePart, Part} from '../lit-html.js';

interface PreviousValue {
  readonly value: unknown;
  readonly fragment: DocumentFragment;
}

// For each part, remember the value that was last rendered to the part by the
// unsafeSVG directive, and the DocumentFragment that was last set as a value.
// The DocumentFragment is used as a unique key to check if the last value
// rendered to the part was with unsafeSVG. If not, we'll always re-render the
// value passed to unsafeSVG.
const previousValues = new WeakMap<NodePart, PreviousValue>();

/**
 * Renders the result as SVG, rather than text.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
export const unsafeSVG = directive((value: unknown) => (part: Part): void => {
  if (!(part instanceof NodePart)) {
    throw new Error('unsafeSVG can only be used in text bindings');
  }

  const previousValue = previousValues.get(part);

  if (previousValue !== undefined && isPrimitive(value) &&
      value === previousValue.value && part.value === previousValue.fragment) {
    return;
  }

  const template = document.createElement('template');
  template.innerHTML = `<svg>${value}</svg>`;
  const content = template.content;
  const svgElement = content.firstChild!;
  content.removeChild(svgElement);
  reparentNodes(content, svgElement.firstChild);
  const fragment = document.importNode(content, true);
  part.setValue(fragment);
  previousValues.set(part, {value, fragment});
});
