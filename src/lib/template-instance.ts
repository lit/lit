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

import {isCEPolyfill} from './dom.js';
import {Part} from './part.js';
import {RenderOptions} from './render-options.js';
import {TemplateProcessor} from './template-processor.js';
import {partMarker, Template, templateMarker} from './template.js';

/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
export class TemplateInstance {
  private readonly __parts: Array<Part|undefined> = [];
  readonly processor: TemplateProcessor;
  readonly options: RenderOptions;
  readonly template: Template;

  constructor(
      template: Template, processor: TemplateProcessor,
      options: RenderOptions) {
    this.template = template;
    this.processor = processor;
    this.options = options;
  }

  update(values: ReadonlyArray<unknown>) {
    let i = 0;
    for (const part of this.__parts) {
      if (part !== undefined) {
        part.setValue(values[i]);
      }
      i++;
    }
    for (const part of this.__parts) {
      if (part !== undefined) {
        part.commit();
      }
    }
  }

  _clone(): DocumentFragment {
    // There are a number of steps in the lifecycle of a template instance's
    // DOM fragment:
    //  1. Clone - create the instance fragment
    //  2. Adopt - adopt into the main document
    //  3. Process - find part markers and create parts
    //  4. Upgrade - upgrade custom elements
    //  5. Update - set node, attribute, property, etc., values
    //  6. Connect - connect to the document. Optional and outside of this
    //     method.
    //
    // We have a few constraints on the ordering of these steps:
    //  * We need to upgrade before updating, so that property values will pass
    //    through any property setters.
    //  * We would like to process before upgrading so that we're sure that the
    //    cloned fragment is inert and not disturbed by self-modifying DOM.
    //  * We want custom elements to upgrade even in disconnected fragments.
    //
    // Given these constraints, with full custom elements support we would
    // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
    //
    // But Safari dooes not implement CustomElementRegistry#upgrade, so we
    // can not implement that order and still have upgrade-before-update and
    // upgrade disconnected fragments. So we instead sacrifice the
    // process-before-upgrade constraint, since in Custom Elements v1 elements
    // must not modify their light DOM in the constructor. We still have issues
    // when co-existing with CEv0 elements like Polymer 1, and with polyfills
    // that don't strictly adhere to the no-modification rule because shadow
    // DOM, which may be created in the constructor, is emulated by being placed
    // in the light DOM.
    //
    // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
    // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
    // in one step.
    //
    // The Custom Elements v1 polyfill supports upgrade(), so the order when
    // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
    // Connect.

    const fragment = isCEPolyfill ?
        this.template.element.content.cloneNode(true) as DocumentFragment :
        document.importNode(this.template.element.content, true);

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
      if (data.slice(0, partMarker.length) === partMarker) {
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
          this.__parts[partIndex] = part;
          partCount--;
        } else {
          // An Attribute TemplatePart. The part marker is directly before the
          // element with the attribute bindings, and the attributeCount tells
          // us how many attributes were bound. Note that each bound attribute
          // can have multiple bindings.
          while (attributeCount-- > 0) {
            const part = parts[partIndex] as
                {name: string, strings: ReadonlyArray<string>};
            const attrs = this.processor.handleAttributeExpressions(
                nextNode as Element, part.name, part.strings, this.options);
            for (let p = 0; p < attrs.length; p++) {
              this.__parts[partIndex++] = attrs[p];
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

    if (isCEPolyfill) {
      document.adoptNode(fragment);
      customElements.upgrade(fragment);
    }
    return fragment;
  }
}
