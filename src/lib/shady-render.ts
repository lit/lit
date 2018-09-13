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

import {insertNodeIntoTemplate, removeNodesFromTemplate} from './modify-template.js';
import {parts, render as litRender} from './render.js';
import {templateCaches} from './template-factory.js';
import {TemplateInstance} from './template-instance.js';
import {TemplateResult} from './template-result.js';
import {Template} from './template.js';

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

let compatibleShadyCSSVersion = true;

if (typeof window.ShadyCSS === 'undefined') {
  compatibleShadyCSSVersion = false;
} else if (typeof window.ShadyCSS.prepareTemplateDom === 'undefined') {
  console.warn(
      `Incompatible ShadyCSS version detected.` +
      `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and` +
      `@webcomponents/shadycss@1.3.1.`);
  compatibleShadyCSSVersion = false;
}

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
        if (compatibleShadyCSSVersion) {
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
        // IE 11 doesn't support the iterable param Set constructor
        const styles = new Set<Element>();
        Array.from(content.querySelectorAll('style')).forEach((s: Element) => {
          styles.add(s);
        });
        removeNodesFromTemplate(template, styles);
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
 * not be scoped and the <style> will be left in the template and rendered
 * output.
 */
const styleTemplatesForScope =
    (fragment: DocumentFragment, template: Template, scopeName: string) => {
      shadyRenderSet.add(scopeName);
      // Move styles out of rendered DOM and store.
      const styles = fragment.querySelectorAll('style');
      const styleFragment = document.createDocumentFragment();
      for (let i = 0; i < styles.length; i++) {
        styleFragment.appendChild(styles[i]);
      }
      // Remove styles from nested templates in this scope.
      removeStylesFromLitTemplates(scopeName);
      // And then put them into the "root" template passed in as `template`.
      insertNodeIntoTemplate(
          template, styleFragment, template.element.content.firstChild);
      // Note, it's important that ShadyCSS gets the template that `lit-html`
      // will actually render so that it can update the style inside when
      // needed.
      window.ShadyCSS.prepareTemplateStyles(template.element, scopeName);
      // When using native Shadow DOM, replace the style in the rendered
      // fragment.
      if (window.ShadyCSS.nativeShadow) {
        const style = template.element.content.querySelector('style');
        if (style !== null) {
          fragment.insertBefore(style.cloneNode(true), fragment.firstChild);
        }
      }
    };

export function render(
    result: TemplateResult,
    container: Element|DocumentFragment,
    scopeName: string) {
  const shouldScope =
      container instanceof ShadowRoot && compatibleShadyCSSVersion;
  const hasScoped = shadyRenderSet.has(scopeName);
  // Call `styleElement` to update element if it's already been processed.
  // This ensures the template is up to date before stamping the template
  // into the shadowRoot *or* updates the shadowRoot if we've already stamped
  // and are just updating the template.
  if (shouldScope && hasScoped) {
    window.ShadyCSS.styleElement((container as ShadowRoot).host);
  }
  litRender(result, container, shadyTemplateFactory(scopeName));
  // When rendering a TemplateResult, scope the template with ShadyCSS
  if (shouldScope && !hasScoped && result instanceof TemplateResult) {
    const part = parts.get(container)!;
    const instance = part.value as TemplateInstance;
    styleTemplatesForScope(
        (container as ShadowRoot), instance.template, scopeName);
  }
}
