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

import {AttributePart} from './attribute-part.js';
import {NodePart} from './node-part.js';
import {Part} from './part.js';
import {TemplateInstance} from './template-instance.js';
import {TemplatePart} from './template-part.js';

export type PartCallback =
    (instance: TemplateInstance, templatePart: TemplatePart, node: Node) =>
        Part;

export const defaultPartCallback =
    (instance: TemplateInstance,
     templatePart: TemplatePart,
     node: Node): Part => {
      if (templatePart.type === 'attribute') {
        return new AttributePart(
            instance, node as Element, templatePart.name!, templatePart.strings!
        );
      } else if (templatePart.type === 'node') {
        return new NodePart(instance, node, node.nextSibling!);
      }
      throw new Error(`Unknown part type ${templatePart.type}`);
    };
