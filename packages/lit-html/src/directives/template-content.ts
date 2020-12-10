/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
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

import {noChange, PartInfo} from '../lit-html.js';
import {directive, Directive, NODE_PART} from '../directive.js';

class TemplateContent extends Directive {
  private _previousTemplate?: HTMLTemplateElement;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== NODE_PART) {
      throw new Error('templateContent can only be used in text bindings');
    }
  }

  render(template: HTMLTemplateElement) {
    if (this._previousTemplate === template) {
      return noChange;
    }
    this._previousTemplate = template;
    return document.importNode(template.content, true);
  }
}

/**
 * Renders the content of a template element as HTML.
 *
 * Note, the template should be developer controlled and not user controlled.
 * Rendering a user-controlled template with this directive
 * could lead to cross-site-scripting vulnerabilities.
 */
export const templateContent = directive(TemplateContent);
