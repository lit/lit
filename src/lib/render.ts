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

/**
 * @module lit-html
 */

import {removeNodes} from './dom.js';
import {NodePart} from './parts.js';
import {PartInfo, RenderOptions} from './render-options.js';
import {templateFactory} from './template-factory.js';

export const parts = new WeakMap<Node, NodePart>();

/**
 * Renders a template result or other value to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result Any value renderable by NodePart - typically a TemplateResult
 *     created by evaluating a template tag like `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */
export const render =
    (result: unknown,
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
        console.log('render container', (container as HTMLElement).innerHTML);
      }
      part.setValue(result);
      part.commit();
    };

export const hydrate =
    (result: unknown,
     container: Element|DocumentFragment,
     options?: Partial<RenderOptions>) => {
      console.log('hydrate', container.childNodes[0].textContent);

      let part = parts.get(container);

      if (part === undefined) {
        let rootPart: PartInfo|undefined = undefined;
        const partStack: PartInfo[] = [];
        const walker = document.createTreeWalker(
            container, NodeFilter.SHOW_COMMENT, null, false);
        let node: Comment|null;
        while ((node = walker.nextNode() as Comment | null) !== null) {
          if (node.nodeType === Node.COMMENT_NODE) {
            if (node.textContent!.startsWith('lit-part')) {
              // This is an NodePart opening marker
              const partInfo = {
                startNode: node,
                endNode: undefined as unknown as Node,
              };
              if (partStack.length > 0) {
                const parentInfo = partStack[partStack.length - 1];
                if (parentInfo.children === undefined) {
                  parentInfo.children = [];
                }
                parentInfo.children.push(partInfo);
              } else {
                console.assert(
                    rootPart === undefined,
                    'there should be exactly one root part in a render container');
                rootPart = partInfo;
              }
              partStack.push(partInfo);
            } else if (node.textContent!.startsWith('/lit-part')) {
              // This is an NodePart closing marker
              const partInfo = partStack.pop()!;
              partInfo.endNode = node;
            }
          }
        }
        console.assert(
            rootPart !== undefined,
            'there should be exactly one root part in a render container');

        part = new NodePart({
          templateFactory,
          ...options,
          prerenderedParts: rootPart!.children
        });
        part.startNode = rootPart!.startNode;
        part.endNode = rootPart!.endNode;
        parts.set(container, part);
      } else {
        part = new NodePart({
          templateFactory,
          ...options,
        });
        parts.set(container, part);
        part.appendInto(container);
      }
      part.setValue(result);
      part.commit();
    };
