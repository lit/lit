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

import {isCEPolyfill, removeNodes} from './dom.js';
import {templateFactory as defaultTemplateFactory, TemplateFactory} from './template-factory.js';
import {TemplateInstance} from './template-instance.js';
import {TemplateResult} from './template-result.js';

export const templateInstances = new WeakMap<Node, TemplateInstance>();

/**
 * Renders a template to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result a TemplateResult created by evaluating a template tag like
 *     `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param templateFactory a function to create a Template or retreive one from
 *     cache.
 */
export function render(
    result: TemplateResult,
    container: Element|DocumentFragment,
    templateFactory: TemplateFactory = defaultTemplateFactory) {
  const template = templateFactory(result);
  let instance = templateInstances.get(container);
  // Repeat render, just call update()
  if (instance !== undefined && instance.template === template &&
      instance.processor === result.processor) {
    instance.update(result.values);
    return;
  }
  // First render, create a new TemplateInstance and append it
  instance = new TemplateInstance(template, result.processor, templateFactory);
  templateInstances.set(container, instance);
  const fragment = instance._clone();
  removeNodes(container, container.firstChild);
  // Since we cloned in the polyfill case, now force an upgrade
  if (isCEPolyfill && !container.isConnected) {
    document.adoptNode(fragment);
    customElements.upgrade(fragment);
  }
  container.appendChild(fragment);
  instance.update(result.values);
}
