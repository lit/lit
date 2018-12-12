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

import {Part} from './part.js';
import {AttributeCommitter, BooleanAttributePart, EventPart, NodePart, PropertyCommitter} from './parts.js';
import {RenderOptions} from './render-options.js';
import {TemplateProcessor} from './template-processor.js';

/**
 * Creates Parts when a template is instantiated.
 */
export class DefaultTemplateProcessor implements TemplateProcessor {
  /**
   * Create parts for an attribute-position binding, given the event, attribute
   * name, and string literals.
   *
   * @param element The element containing the binding
   * @param name  The attribute name
   * @param strings The string literals. There are always at least two strings,
   *   event for fully-controlled bindings with a single expression.
   */
  handleAttributeExpressions(
      element: Element, name: string, strings: string[],
      options: RenderOptions): Part[] {
    const prefix = name[0];
    if (prefix === '.') {
      const comitter = new PropertyCommitter(element, name.slice(1), strings);
      return comitter.parts;
    }
    if (prefix === '@') {
      return [new EventPart(element, name.slice(1), options.eventContext)];
    }
    if (prefix === '?') {
      return [new BooleanAttributePart(element, name.slice(1), strings)];
    }
    const comitter = new AttributeCommitter(element, name, strings);
    return comitter.parts;
  }
  /**
   * Create parts for a text-position binding.
   * @param templateFactory
   */
  handleTextExpression(options: RenderOptions) {
    return new NodePart(options);
  }
}

export const defaultTemplateProcessor = new DefaultTemplateProcessor();
