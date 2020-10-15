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

import {directive, TemplateResult, NodePart, Directive} from '../lit-html.js';
import {detachNodePart, restoreNodePart, NodePartState} from '../parts.js';

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
    templateCache = new WeakMap<TemplateStringsArray, NodePartState>();
    value?: TemplateResult;

    render(v: unknown) {
      return v;
    }

    update(part: NodePart, [v]: Parameters<this['render']>) {
      // If the new value is not a TemplateResult from the same Template as the
      // previous value, move the nodes from the DOM into the cache.
      if (
        this.value !== undefined &&
        this.value.strings !== (v as TemplateResult).strings
      ) {
        this.templateCache.set(this.value.strings, detachNodePart(part));
      }

      // If the new value is a TemplateResult, try to restore it from cache
      if ((v as TemplateResult)._$litType$ !== undefined) {
        const cachedTemplate = this.templateCache.get(
          (v as TemplateResult).strings
        );
        if (cachedTemplate !== undefined) {
          restoreNodePart(part, cachedTemplate);
        }
        this.value = v as TemplateResult;
      } else {
        this.value = undefined;
      }
      return this.render(v);
    }
  }
);
