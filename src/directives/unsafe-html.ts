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

import { directive, NodePart, Part } from '../lit-html.js';

/**
 * Renders the result as HTML, rather than text.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */

type CachedTemplate = {
  template: HTMLTemplateElement;
  fragment: DocumentFragment;
};

// Use a cache for TemplateElements so we don't have to parse the same HTML string twice
const templateCache = new Map<string, HTMLTemplateElement>();

// For each part, remember the TemplateElement that was last used to render in that part, and the DocumentFragment that was last set as a value.
const partValues = new WeakMap<NodePart, CachedTemplate>();

export const unsafeHTML = directive((value: any) => (part: Part): void => {
  if (!(part instanceof NodePart)) {
    throw new Error('unsafeHTML can only be used in text bindings');
  }

  // Cast value to String only if necessary, to improve cache lookups
  const htmlString = typeof value === 'string' ? value : String(value);

  let template = templateCache.get(htmlString);
  if (!template) {
    template = document.createElement('template');
    template.innerHTML = htmlString;
    templateCache.set(htmlString, template);
  }

  const previousValue = partValues.get(part);
  /**
   * Need to render only if one of the following is true
   * - This part never rendered unsafeHTML previously
   * - The new template does not match the previously rendered template
   * - The previously rendered fragment is not the current value of the part
   */
  if (!previousValue || template !== previousValue.template || part.value !== previousValue.fragment) {
    const fragment = document.importNode(template.content, true);
    part.setValue(fragment);
    partValues.set(part, { template, fragment });
  }
});
