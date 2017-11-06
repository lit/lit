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

import {Part, MultiPart, SinglePart} from './part.js';
import {defaultPartCallback, PartCallback} from './part-callback.js';
import {Template} from './template.js';

/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
export class TemplateInstance {
  _parts: Part[] = [];
  _partCallback: PartCallback;
  template: Template;

  constructor(
      template: Template, partCallback: PartCallback = defaultPartCallback) {
    this.template = template;
    this._partCallback = partCallback;
  }

  update(values: any[]) {
    let valueIndex = 0;
    for (const part of this._parts) {
      if (part.size === undefined) {
        (part as SinglePart).setValue(values[valueIndex]);
        valueIndex++;
      } else {
        (part as MultiPart).setValue(values, valueIndex);
        valueIndex += part.size;
      }
    }
  }

  _clone(): DocumentFragment {
    const fragment = document.importNode(this.template.element.content, true);
    const parts = this.template.parts;

    if (parts.length > 0) {
      // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
      // null
      const walker = document.createTreeWalker(
          fragment,
          133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
                 NodeFilter.SHOW_TEXT */
          ,
          null as any,
          false);

      let index = -1;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        while (index < part.index) {
          index++;
          walker.nextNode();
        }
        this._parts.push(this._partCallback(this, part, walker.currentNode));
      }
    }
    return fragment;
  }
}
