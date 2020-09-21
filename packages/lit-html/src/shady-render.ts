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
 * LitElement patch to support browsers without native web components.
 *
 * @packageDocumentation
 */

// TODO(sorvell) Add shady-render package.
import {
  render,
  RenderOptions,
  NodePart,
  TemplateResult,
  Template,
} from './lit-html.js';

const styledScopes: Set<string> = new Set();
const scopeCss: Map<string, string[]> = new Map();
let currentScope: string;

export const needsPolyfill =
  window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow;
export const isScopeStyled = (name: string | undefined) =>
  needsPolyfill && name !== undefined ? styledScopes.has(name) : true;
export const cssForScope = (name: string) => {
  if (isScopeStyled(name)) {
    return;
  }
  let css = scopeCss.get(name);
  if (css === undefined) {
    scopeCss.set(name, (css = []));
  }
  return css;
};

/**
 * Patch `render` to:
 * * manage `scopeData` during calls into lit-html.
 * * Once per scope, apply gathered css via ShadyCSS.
 */
export let shadyRender = (
  result: unknown,
  container: HTMLElement | DocumentFragment,
  options: RenderOptions,
  name: string
) => {
  const previousScope = currentScope;
  currentScope = name;
  render(result, container, options);
  ensureStyles(currentScope);
  currentScope = previousScope;
};

const ensureStyles = (name: string) => {
  if (isScopeStyled(name)) {
    return;
  }
  const css = cssForScope(name);
  styledScopes.add(name);
  // Remove stored data
  scopeCss.delete(name);
  if (css && css.length) {
    window.ShadyCSS!.ScopingShim!.prepareAdoptedCssText(css, name);
    // TODO(sorvell): ShadyCSS requires a template but we're not using
    // it so just provide an empty template.
    window.ShadyCSS!.ScopingShim!.prepareTemplate(
      document.createElement('template'),
      name
    );
  }
};

/**
 * lit-html patches. These properties cannot be renamed.
 * * NodePart.prototype._getTemplate
 * * Template.prototype._createElement
 */
if (needsPolyfill) {
  console.log(
    '%c Making lit-html compatible with ShadyDOM/CSS.',
    'color: lightgreen; font-style: italic'
  );

  const scopedTemplateCache = new Map<
    string,
    Map<TemplateStringsArray, Template>
  >();

  /**
   * Patch NodePart._getTemplate to look up templates in a cache bucketed
   * by element name.
   */
  function _getTemplate(strings: TemplateStringsArray, result: TemplateResult) {
    //console.log('patched _getTemplate:', name);
    let templateCache = scopedTemplateCache.get(name);
    if (templateCache === undefined) {
      scopedTemplateCache.set(name, (templateCache = new Map()));
    }
    let template = templateCache.get(strings);
    if (template === undefined) {
      templateCache.set(strings, (template = new Template(result)));
    }
    return template;
  }

  Object.defineProperty(NodePart.prototype, '_getTemplate', {
    value: _getTemplate,
    enumerable: true,
    configurable: true,
  });

  interface PolyfilledTemplate extends Template {
    _baseCreateElement: (html: string) => HTMLTemplateElement;
  }

  /**
   * Patch Template._createElement to extract style elements from the template
   * and store all style.textContent in the shady scope data.
   */
  function _createElement(this: PolyfilledTemplate, html: string) {
    //console.log('patched _createElement:', name);
    const template = this._baseCreateElement(html);
    window.ShadyCSS!.ScopingShim!.prepareTemplateDom(template, currentScope);
    const css = cssForScope(currentScope);
    if (css !== undefined) {
      // Remove styles and store their textContent.
      const styles = template.content.querySelectorAll('style');
      css?.push(
        ...Array.from(styles).map((style) => {
          style.parentNode?.removeChild(style);
          return style.textContent!;
        })
      );
    }
    return template;
  }

  Object.defineProperties(Template.prototype, {
    _baseCreateElement: {
      value: Template.prototype._createElement,
      enumerable: true,
      configurable: true,
    },
    _createElement: {
      value: _createElement,
      enumerable: true,
      configurable: true,
    },
  });
}
