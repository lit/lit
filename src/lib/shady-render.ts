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

// Get a key to lookup in `templateCaches`.
const getTemplateCacheKey = (type: string, scopeName: string) =>
    `${type}--${scopeName}`;

/**
 * Template factory which scopes template DOM using ShadyCSS.
 * @param scopeName {string}
 */
const shadyTemplateFactory = (scopeName: string) =>
    (result: TemplateResult) => {
      const cacheKey = getTemplateCacheKey(result.type, scopeName);
      let templateCache = templateCaches.get(cacheKey);
      if (templateCache === undefined) {
        templateCache = new Map<TemplateStringsArray, Template>();
        templateCaches.set(cacheKey, templateCache);
      }
      let template = templateCache.get(result.strings);
      if (template === undefined) {
        const element = result.getTemplateElement();
        if (typeof window.ShadyCSS === 'object') {
          window.ShadyCSS.prepareTemplateDom(element, scopeName);
        }
        template = new Template(result, element);
        templateCache.set(result.strings, template);
      }
      return template;
    };


const TEMPLATE_TYPES = ['html', 'svg'];

/**
 * Removes all style elements from Templates for the given scopeName.
 */
function removeStylesFromLitTemplates(scopeName: string) {
  TEMPLATE_TYPES.forEach((type) => {
    const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
    if (templates !== undefined) {
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
 *
 * Note, <style> elements can only be placed into templates for the
 * initial rendering of the scope. If <style> elements are included in templates
 * dynamically rendered to the scope (after the first scope render), they will
 * not be scoped and the <style> will be left in the template and rendered output.
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
        // Fix templates: note the expectation here is that the given `fragment`
        // has been generated from the given `template` which contains
        // the set of templates rendered into this scope.
        // It is only from this set of initial templates from which styles
        // will be scoped and removed.
        removeStylesFromLitTemplates(scopeName);
        // ApplyShim case
        if (window.ShadyCSS.nativeShadow) {
          const style = styleTemplate.content.querySelector('style');
          if (style !== null) {
            // Insert style into rendered fragment
            fragment.insertBefore(style, fragment.firstChild);
            // Insert into lit-template (for subsequent renders)
            insertNodeIntoTemplate(
                template,
                style.cloneNode(true),
                template.element.content.firstChild);
          }
        }
      }
    };

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

  // If there's a shadow host, do ShadyCSS scoping...
  if (host !== undefined && typeof window.ShadyCSS === 'object') {
    ensureStylesScoped(fragment, template, scopeName);
    window.ShadyCSS.styleElement(host);
  }

  removeNodes(container, container.firstChild);
  container.appendChild(fragment);
}