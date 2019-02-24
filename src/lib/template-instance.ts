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
import {isTemplatePartActive, Template, TemplatePart} from './template.js';

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
    // When using the Custom Elements polyfill, clone the node, rather than
    // importing it, to keep the fragment in the template's document. This
    // leaves the fragment inert so custom elements won't upgrade and
    // potentially modify their contents by creating a polyfilled ShadowRoot
    // while we traverse the tree.
    const fragment = isCEPolyfill ?
        this.template.element.content.cloneNode(true) as DocumentFragment :
        document.importNode(this.template.element.content, true);

    const parts = this.template.parts;
    // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
    const walker = document.createTreeWalker(
        document,
        133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */,
        null,
        false);
    let partIndex = 0;
    let nodeIndex = 0;
    let part: TemplatePart;
    const _prepareInstance = (fragment: DocumentFragment) => {
      walker.currentNode = fragment;
      let node = walker.nextNode();
      // Loop through all the nodes and parts of a template
      while (partIndex < parts.length) {
        part = parts[partIndex];
        if (!isTemplatePartActive(part)) {
          this._parts.push(undefined);
          partIndex++;
          continue;
        }
        // Progress the tree walker until we find our next part's node.
        // Note that multiple parts may share the same node (attribute parts
        // on a single element), so this loop may not run at all.
        while (nodeIndex < part.index) {
          nodeIndex++;
          if (node!.nodeName === 'TEMPLATE') {
            _prepareInstance((node as HTMLTemplateElement).content);
            walker.currentNode = node!;
          }
          if ((node = walker.nextNode()) === null) {
            // We've exhausted all the nodes in a nested template.
            return;
          }
        }
        // We've arrived at our part's node.
        if (part.type === 'node') {
          const part = this.processor.handleTextExpression(this.options);
          part.insertAfterNode(node!.previousSibling!);
          this._parts.push(part);
        } else {
          this._parts.push(...this.processor.handleAttributeExpressions(
              node as Element, part.name, part.strings, this.options));
        }
        partIndex++;
      }
    };
    _prepareInstance(fragment);
    if (isCEPolyfill) {
      document.adoptNode(fragment);
      customElements.upgrade(fragment);
    }
    return fragment;
  }
}
