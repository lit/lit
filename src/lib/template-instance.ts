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
import {partMarker, Template, templateMarker} from './template.js';

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
    const stack: Element[] = [];
    const {parts} = this.template;

    // Count the active number of parts. In a normal render (not ShadyCSS),
    // this will allow us to early exit after finding the last part.
    let partCount = 0;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] !== undefined) {
        partCount++;
      }
    }

    while (partCount > 0) {
      const comment = walker.nextNode() as Comment;

      // If element is null, that means we've either:
      // * Traversed all elements in the current template, and need to process
      //   a nested template.
      // * ShadyCSS mucked with the template.
      if (comment === null) {
        const template = stack.pop();
        if (template === undefined) {
          // ShadyCSS removed a style element that had a binding. Oh well.
          break;
        }
        walker.currentNode = template;
        continue;
      }
      const {data} = comment;
      if (data === '') {
        continue;
      }

      // Does this comment starts with the part marker?
      if (data.lastIndexOf(partMarker, 0) === 0) {
        const packed = parseInt(data.slice(partMarker.length), 10);
        let partIndex = packed & 0xffff;
        let attributeCount = packed >>> 16;

        const next = comment.nextSibling!;
        walker.currentNode = next;
        comment.parentNode!.removeChild(comment);

        if (attributeCount === 0) {
          const part = this.processor.handleTextExpression(this.options);
          part.insertAfterNode(next.previousSibling!);
          this._parts[partIndex] = part;
          partCount--;
        } else {
          // Multiple Attribute TemplateParts can be bound onto a single
          // attribute, and multiple attributes-with-bindings onto the element.
          while (attributeCount-- > 0) {
            const part = parts[partIndex] as {name: string, strings: string[]};
            const attrs = this.processor.handleAttributeExpressions(
                next as Element, part.name, part.strings, this.options);
            for (let p = 0; p < attrs.length; p++) {
              this._parts[partIndex++] = attrs[p];
            }
            partCount -= attrs.length;
          }
        }
      } else if (data === templateMarker) {
        const template = comment.previousSibling! as HTMLTemplateElement;
        walker.currentNode = template.content;
        comment.parentNode!.removeChild(comment);
        stack.push(template);
      }
    }

    // Now that the instance is prepared, upgrade any nested custom elements so
    // that they can do their setup before the template parts are committed.
    document.adoptNode(fragment);
    customElements.upgrade(fragment);
    return fragment;
  }
}
