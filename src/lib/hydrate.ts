/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
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

import {NodePart} from './parts.js';
import {PartInfo, RenderOptions} from './render-options.js';
import {templateFactory} from './template-factory.js';
import {parts} from './render.js';

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

        // If not specified, assume template data has changed since pre-rendering.
        // Assuming data has changed may cause unnecessary DOM reconstruction;
        // however, this is better than displaying the wrong data.

        part = new NodePart({
          templateFactory,
          ...options,
          dataChanged: (options && options.dataChanged !== undefined) ? options.dataChanged : true,
          hydrate: true,
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
