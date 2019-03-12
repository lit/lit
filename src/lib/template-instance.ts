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
import {RenderOptions} from './render-options.js';
import {TemplateProcessor} from './template-processor.js';
import {marker, Template} from './template.js';

/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
export class TemplateInstance {
  _parts: Array<Part|undefined> = [];
  processor: TemplateProcessor;
  options: RenderOptions;
  template: Template;

  constructor(
      template: Template, processor: TemplateProcessor,
      options: RenderOptions) {
    this.template = template;
    this.processor = processor;
    this.options = options;
  }

  update(values: unknown[]) {
    let i = 0;
    for (const part of this._parts) {
      if (part !== undefined) {
        part.setValue(values[i]);
      }
      i++;
    }
    for (const part of this._parts) {
      if (part !== undefined) {
        part.commit();
      }
    }
  }

  _clone(): DocumentFragment {
    // Clone the node, rather than importing it, to keep the fragment in the
    // template's document. This leaves the fragment inert so custom elements
    // won't upgrade and potentially modify their contents before we traverse
    // the tree.
    const fragment =
        this.template.element.content.cloneNode(true) as DocumentFragment;

    // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
    const walker = document.createTreeWalker(
        fragment, 128 /* NodeFilter.SHOW_COMMENT */, null, false);
    const {parts} = this.template;

    parts.forEach((partList) => {
      let commentNode = walker.nextNode() as Comment;
      while (commentNode.data !== marker) {
        commentNode = walker.nextNode() as Comment;
      }
      partList.forEach((partDescription) => {
        if (partDescription.type === 'node') {
          const part = this.processor.handleTextExpression(this.options);
          part.insertAfterNode(commentNode);
          this._parts.push(part);
        } else if (partDescription.type === 'attribute') {
          const parts = this.processor.handleAttributeExpressions(
              commentNode.nextSibling as Element,
              partDescription.name,
              partDescription.strings,
              this.options);
          parts.forEach((part) => this._parts.push(part));
          commentNode.parentNode!.removeChild(commentNode);
        } else if (partDescription.type === 'comment') {
          // TODO: Make something that handles comment expressions
          const part = this.processor.handleTextExpression(this.options);
          part.insertAfterNode(commentNode);
          commentNode.parentNode!.removeChild(commentNode);
          this._parts.push(part);
        } else {
          // Style Node
          // TODO: Make this way less dirty
          const styleNode = commentNode.previousSibling as Element;
          partDescription.strings.forEach((s) => {
            styleNode.appendChild(document.createTextNode(s));
          });
          for (let i = 0; i++; i < partDescription.strings.length - 1) {
            const part = this.processor.handleTextExpression(this.options);
            part.insertAfterNode(styleNode.childNodes[i]);
            this._parts.push(part);
          }
          commentNode.parentNode!.removeChild(commentNode);
        }
      });
    });

    return fragment;
  }
}
