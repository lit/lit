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
      // If the new value is not a TemplateResult from the same Template as the
      // previous value, move the nodes from the DOM into the cache.
      if (
        this.value !== undefined &&
        this.value.strings !== (v as TemplateResult).strings
      ) {
        // This is always an array because we return [v] in render()
        const partValue = getComittedValue(containerPart) as Array<ChildPart>;
        const childPart = partValue.pop()!;
        let cachedContainerPart = this.templateCache.get(this.value.strings);
        if (cachedContainerPart === undefined) {
          const fragment = new DocumentFragment();
          cachedContainerPart = render(nothing, fragment);
          setComittedValue(cachedContainerPart, [childPart]);
          this.templateCache.set(this.value.strings, cachedContainerPart);
        }
        // Move into cache
        insertPart(containerPart, undefined, childPart);
        clearPart(containerPart);
      }
      // If the new value is a TemplateResult, try to restore it from cache
      if (isTemplateResult(v)) {
        const cachedContainerPart = this.templateCache.get(v.strings);
        if (cachedContainerPart !== undefined) {
          // Move the cached part back into the container part value
          const partValue = getComittedValue(
            cachedContainerPart
          ) as Array<ChildPart>;
          const cachedPart = partValue.pop()!;
          setComittedValue(containerPart, cachedPart);
          // Move cached part back into DOM
          insertPart(containerPart, undefined, cachedPart);
        }
        this.value = v;
      } else {
        this.value = undefined;
      }
      return this.render(v);
    }
  }
);
