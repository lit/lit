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

import {AttributePart, BooleanAttributePart, directive, EventPart, NodePart, Part} from '../lit-html.js';

/**
 * For AttributeParts, NodeParts, sets the reference of parts on partRefs
 * partRefs.get(element)
 * Example:
 *
 * ```js
 * let tpl = html`
 * <div id="btn" class=${partRef('cls1', 'class')}>${partRef('contents',
 'body')}</div>
 * `
 * render(tpl, document.body);

 * let parts = partRefs.get(document.getElementById('btn'))
 * parts['class'].setValue("new class")
 * parts['class'].commit();
 * parts['body'].setValue("new contents")
 * parts['body'].commit();

 * ```
 *
 */
export const partRef = directive(
    (value: unknown, key: string, element?: Partial<object>) =>
        (part: Part) => {
          part.setValue(value);
          if (!element) {
            if ((part instanceof BooleanAttributePart ||
                 part instanceof EventPart) &&
                part.element) {
              element = part.element
            } else if (part instanceof AttributePart && part.committer) {
              element = part.committer.element
            } else if (part instanceof NodePart && part.startNode) {
              element = part.startNode.parentNode as Element;
            }
          }
          if (!element)
            return;
          let parts = partRefs.get(element);
          if (!parts) {
            partRefs.set(element, parts = {});
          }
          parts[key] = part;
        });

export const partRefs = new WeakMap<Partial<object>, {[k: string]: Part}>();
