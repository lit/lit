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

import {TemplateResult, ChildPart, render, nothing} from '../lit-html.js';
import {
  directive,
  Directive,
  DirectiveParameters,
  PartInfo,
} from '../directive.js';
import {
  clearPart,
  getComittedValue,
  insertPart,
  isTemplateResult,
  setComittedValue,
} from '../directive-helpers.js';

/**
 * Enables fast switching between multiple templates by caching the DOM nodes
 * and TemplateInstances produced by the templates.
 *
 * Example:
 *
 * ```
 * let checked = false;
 *
 * html`
 *   ${cache(checked ? html`input is checked` : html`input is not checked`)}
 * `
 * ```
 */
export const cache = directive(
  class extends Directive {
    templateCache = new WeakMap<TemplateStringsArray, ChildPart>();
    value?: TemplateResult;

    constructor(partInfo: PartInfo) {
      super(partInfo);
    }

    render(v: unknown) {
      // Return an array of the value to induce lit-html to create a ChildPart
      // for the value that we can move into the cache.
      return [v];
    }

    update(containerPart: ChildPart, [v]: DirectiveParameters<this>) {
      // If the previous value is a TemplateResult and the new value is not,
      // or is a different Template as the previous value, move the child part
      // into the cache.
      if (
        isTemplateResult(this.value) && 
        (!isTemplateResult(v) || this.value.strings !== v.strings)) {
        // This is always an array because we return [v] in render()
        const partValue = getComittedValue(containerPart) as Array<ChildPart>;
        const childPart = partValue.pop()!;
        let cachedContainerPart = this.templateCache.get(this.value.strings);
        if (cachedContainerPart === undefined) {
          const fragment = document.createDocumentFragment();
          cachedContainerPart = render(nothing, fragment);
          this.templateCache.set(this.value.strings, cachedContainerPart);
        }
        // Move into cache
        setComittedValue(cachedContainerPart, [childPart]);
        insertPart(cachedContainerPart, undefined, childPart);
      }
      // If the new value is a TemplateResult and the previous value is not,
      // or is a different Template as the previous value, restore the child
      // part from the cache.
      if (isTemplateResult(v) && 
          (!isTemplateResult(this.value) || this.value.strings !== v.strings)) {
        const cachedContainerPart = this.templateCache.get(v.strings);
        if (cachedContainerPart !== undefined) {
          // Move the cached part back into the container part value
          const partValue = getComittedValue(
            cachedContainerPart
          ) as Array<ChildPart>;
          const cachedPart = partValue.pop()!;
          // Move cached part back into DOM
          clearPart(containerPart);
          insertPart(containerPart, undefined, cachedPart);
          setComittedValue(containerPart, [cachedPart]);
        }
        this.value = v;
      } else {
        this.value = undefined;
      }
      return this.render(v);
    }
  }
);
