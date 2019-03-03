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

    // Count the active number of parts. This will allow us to early exit after
    // finding the last part, instead of exhausting the entire tree.
    let partCount = 0;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] !== undefined) {
        partCount++;
      }
    }

    while (partCount > 0) {
      const comment = walker.nextNode() as Comment;

      if (comment === null) {
        // We've exhausted the content inside a nested template element.
        // Because we still have parts (the outer for-loop), we know:
        // * There is a template in the stack
        // * The walker will find a nextNode outside the template
        walker.currentNode = stack.pop()!;
        continue;
      }

      const {data} = comment;
      if (data === '') {
        continue;
      }

      // Does this comment start with the part marker?
      if (data.lastIndexOf(partMarker, 0) === 0) {
        // The part marker packs the part index in the 16 low bits and
        // attribute count (if it's an attribute binding) in the 16 high bits.
        const packed = parseInt(data.slice(partMarker.length), 10);
        let partIndex = packed & 0xffff;
        let attributeCount = packed >>> 16;

        // We know the part marker comes directly before the node we care
        // about. The marker itself is dead weight after this, so we can remove
        // it by advancing the walker to the real node.
        const nextNode = comment.nextSibling!;
        walker.currentNode = nextNode;
        comment.parentNode!.removeChild(comment);

        if (attributeCount === 0) {
          // A Node TemplatePart. The part marker was inserted between the
          // startNode and the endNode, meaning nextNode is the endNode.
          const part = this.processor.handleTextExpression(this.options);
          part.insertAfterNode(nextNode.previousSibling!);
          this._parts[partIndex] = part;
          partCount--;
        } else {
          // An Attribute TemplatePart. The part marker is directly before the
          // element with the attribute bindings, and the attributeCount tells
          // us how many attributes were bound. Note that each bound attribute
          // can have multiple bindings.
          while (attributeCount-- > 0) {
            const part = parts[partIndex] as {name: string, strings: string[]};
            const attrs = this.processor.handleAttributeExpressions(
                nextNode as Element, part.name, part.strings, this.options);
            for (let p = 0; p < attrs.length; p++) {
              this._parts[partIndex++] = attrs[p];
            }
            partCount -= attrs.length;
          }
        }
      } else if (data === templateMarker) {
        // A template marker comes directly after the template element. By
        // advancing the walker to the template's content, we're able to remove
        // the marker.
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
