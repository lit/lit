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

import {render as baseRender, Template, templateCaches, TemplateResult, renderToDom} from '../lit-html.js';
import {removeNodesFromTemplate, insertNodeIntoTemplate} from './modify-template.js';

export {html, svg, TemplateResult} from '../lit-html.js';

declare global {
  interface Window {
    ShadyCSS: any;
  }
}

/**
 * Template factory which scopes template DOM using ShadyCSS.
 * @param scopeName {string}
 */
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
    window.ShadyCSS.prepareTemplateDom(element, scopeName);
    template = new Template(result, element);
    templateCache.set(result.strings, template);
  }
  return template;
};

const TEMPLATE_TYPES = ['html', 'svg'];
function removeStylesFromLitTemplates(scopeName: string) {
  TEMPLATE_TYPES.forEach((type) => {
    const templates = templateCaches.get(`${type}--${scopeName}`);
    if (templates) {
      templates.forEach((template) => {
        const {element: {content}} = template;
        const styles = content.querySelectorAll('style');
        removeNodesFromTemplate(template, Array.from(styles));
      });
    }
  });
}

const shadyRenderSet = new Set<string>();

function hostForNode(node: Node) {
  return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && (node as ShadowRoot).host
}

export function render(
    result: TemplateResult,
    container: Element|DocumentFragment,
    scopeName: string) {
  const host = hostForNode(container);
  if (host && typeof window.ShadyCSS === 'object') {
    const templateFactory = shadyTemplateFactory(scopeName);
    const renderer = (container: Element|DocumentFragment, fragment: DocumentFragment) => {
      if (!shadyRenderSet.has(scopeName)) {
        shadyRenderSet.add(scopeName);
        const styleTemplate = document.createElement('template');
        Array.from(fragment.querySelectorAll('style')).forEach((s: Element) => {
          styleTemplate.content.appendChild(s);
        });
        window.ShadyCSS.prepareTemplateStyles(styleTemplate, scopeName);
        // fix templates.
        removeStylesFromLitTemplates(scopeName);
        // ApplyShim case.
        if (window.ShadyCSS.nativeShadow) {
          const style = styleTemplate.content.querySelector('style');
          if (style) {
            // insert style into rendered fragment
            fragment.insertBefore(style, fragment.firstChild);
            // insert into lit-template (for subsequent renders)
            const template = templateFactory(result);
            insertNodeIntoTemplate(template, style.cloneNode(true),
                template.element.content.firstChild);
          }
        }
      }
      window.ShadyCSS.styleElement(host);
      renderToDom(container, fragment);
    }
    return baseRender(result, container, templateFactory, renderer);
  } else {
    return baseRender(result, container);
  }
}
