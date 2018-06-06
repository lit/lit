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

import {removeNodes, Template, templateCaches, TemplateContainer, TemplateInstance, TemplateResult} from '../lit-html.js';

import {insertNodeIntoTemplate, removeNodesFromTemplate} from './modify-template.js';

export {html, svg, TemplateResult} from '../lit-html.js';

declare global {
  interface Window {
    ShadyCSS: any;
  }
  class ShadowRoot {}
}

const getTemplateKey = (type: string, scopeName: string) =>
    `${type}--${scopeName}`;

/**
 * Template factory which scopes template DOM using ShadyCSS.
 * @param scopeName {string}
 */
const shadyTemplateFactory = (scopeName: string) =>
    (result: TemplateResult) => {
      const cacheKey = getTemplateKey(result.type, scopeName);
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

/**
 * Removes all style elements from Templates for hte given scopeName
 */
function removeStylesFromLitTemplates(scopeName: string) {
  TEMPLATE_TYPES.forEach((type) => {
    const templates = templateCaches.get(getTemplateKey(type, scopeName));
    if (templates) {
      templates.forEach((template) => {
        const {element: {content}} = template;
        const styles = content.querySelectorAll('style');
        removeNodesFromTemplate(template, new Set(Array.from(styles)));
      });
    }
  });
}

const shadyRenderSet = new Set<string>();

/**
 * For the given scope name, ensures that ShadyCSS style scoping is performed.
 * This is done just once per scope name so the fragment and template cannot
 * be modified.
 * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
 * to be scoped and appended to the document
 * (2) removes style elements from all lit-html Templates for this scope name.
 */
const ensureStylesScoped =
    (fragment: DocumentFragment, template: Template, scopeName: string) => {
      // only scope element template once per scope name
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
            insertNodeIntoTemplate(
                template,
                style.cloneNode(true),
                template.element.content.firstChild);
          }
        }
      }
    }

// NOTE: We're copying code from lit-html's `render` method here.
// We're doing this explicitly because the API for rendering templates is likely
// to change in the near term.
export function render(
    result: TemplateResult,
    container: Element|DocumentFragment,
    scopeName: string) {
  const templateFactory = shadyTemplateFactory(scopeName);
  const template = templateFactory(result);
  let instance = (container as TemplateContainer).__templateInstance;

  // Repeat render, just call update()
  if (instance !== undefined && instance.template === template &&
      instance._partCallback === result.partCallback) {
    instance.update(result.values);
    return;
  }

  // First render, create a new TemplateInstance and append it
  instance =
      new TemplateInstance(template, result.partCallback, templateFactory);
  (container as TemplateContainer).__templateInstance = instance;

  const fragment = instance._clone();
  instance.update(result.values);

  const host = container instanceof ShadowRoot ?
      container.host :
      undefined;

  // if there's a shadow host, do ShadyCSS scoping...
  if (host !== undefined && typeof window.ShadyCSS === 'object') {
    ensureStylesScoped(fragment, template, scopeName);
    window.ShadyCSS.styleElement(host);
  }

  removeNodes(container, container.firstChild);
  container.appendChild(fragment);
}