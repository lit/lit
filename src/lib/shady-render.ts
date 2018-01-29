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

import {render as baseRender, Template, templateCaches, TemplateResult} from '../lit-html.js';

export {html, svg, TemplateResult} from '../lit-html.js';

declare global {
  interface Window {
    ShadyCSS: any;
  }
}

const shadyTemplateFactory = (scopeName: string) =>
    (result: TemplateResult) => {
      const cacheKey = `${result.type}--${scopeName}`;
      let templateCache = templateCaches.get(cacheKey);
      if (templateCache === undefined) {
        templateCache = new Map<TemplateStringsArray, Template>();
        templateCaches.set(cacheKey, templateCache);
      }
      let template = templateCache.get(result.strings);
      if (template === undefined) {
        const element = result.getTemplateElement();

        if (typeof window.ShadyCSS === 'object') {
          window.ShadyCSS.prepareTemplate(element, scopeName);
        }

        template = new Template(result, element);
        templateCache.set(result.strings, template);
      }
      return template;
    };

export function render(
    result: TemplateResult,
    container: Element|DocumentFragment,
    scopeName: string) {
  return baseRender(result, container, shadyTemplateFactory(scopeName));
}
