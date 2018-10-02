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

import {removeNodes} from './dom.js';
import {NodePart} from './parts.js';
import {RenderOptions} from './render-options.js';
import {templateFactory} from './template-factory.js';
import {TemplateResult} from './template-result.js';

export const parts = new WeakMap<Node, NodePart>();

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
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */
export const render =
    (result: TemplateResult,
     container: Element|DocumentFragment,
     options?: Partial<RenderOptions>) => {
      let part = parts.get(container);
      if (part === undefined) {
        removeNodes(container, container.firstChild);
        parts.set(container, part = new NodePart({
                               templateFactory,
                               ...options,
                             }));
        part.appendInto(container);
      }
      part.setValue(result);
      part.commit();
    };
