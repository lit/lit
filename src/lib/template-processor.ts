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
import {NodePart} from './parts.js';
import {RenderOptions} from './render-options.js';
import {AttributeTemplatePart, NodeTemplatePart} from './template.js';

export interface TemplateProcessor {
  /**
   * Create parts for an attribute-position binding, given the event, attribute
   * name, and string literals.
   *
   * @param element The element containing the binding
   * @param name  The attribute name
   * @param strings The string literals. There are always at least two strings,
   *   event for fully-controlled bindings with a single expression.
   * @param templatePart The AttributeTemplatePart for this expression
   *     as extracted by the Template class. Can be used to cache information
   *     that should be computed once per template literal in the source code.
   */
  handleAttributeExpressions(
      element: Element, name: string, strings: readonly string[],
      options: RenderOptions,
      // TODO: next breaking change, consider making this required
      templatePart?: AttributeTemplatePart): readonly Part[];

  /**
   * Create parts for a text-position binding.
   * @param partOptions
   */
  handleTextExpression(
      options: RenderOptions,
      // TODO: next breaking change, consider making this required
      templatePart?: NodeTemplatePart): NodePart;
}
