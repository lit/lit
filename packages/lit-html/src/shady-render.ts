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
  render as litRender,
  RenderOptions,
  NodePart,
  TemplateResult,
  Template,
} from './lit-html.js';

type ScopeCSS = {css: string[]; adoptedCss: string[]};

const styledScopes: Set<string> = new Set();
const scopeCssStore: Map<string, ScopeCSS> = new Map();
let currentScope: string;

export const needsPolyfill = !!(
  window.ShadyCSS !== undefined &&
  (!window.ShadyCSS.nativeShadow || window.ShadyCSS.ApplyShim)
);
export const isScopeStyled = (name: string | undefined) =>
  needsPolyfill && name !== undefined ? styledScopes.has(name) : true;

export const cssForScope = (name: string) => {
  if (isScopeStyled(name)) {
    return;
  }
  let scopeCss = scopeCssStore.get(name);
  if (scopeCss === undefined) {
    scopeCssStore.set(name, (scopeCss = {css: [], adoptedCss: []}));
  }
  return scopeCss;
};

interface ShadyTemplateResult extends TemplateResult {
  __renderIntoShadowRoot?: boolean;
}

/**
 * Patch `render` to:
 * * manage `scopeData` during calls into lit-html.
 * * Once per scope, apply gathered css via ShadyCSS.
 */
export const render = (
  result: unknown,
  container: HTMLElement | DocumentFragment,
  options?: RenderOptions,
  name: string = ''
) => {
  const previousScope = currentScope;
  currentScope = name;
  // TODO(sorvell): goes with `styleElement` call below.
  //const hasRendered = !!(container as any).$lit$;
  const renderingIntoShadowRoot = container instanceof ShadowRoot;
  const renderingTemplateResult = !!(result as any)?._$litType$;
  // If result is a TemplateResult decorate it so that when the template
  // is created, styling can be shimmed.
  if (renderingTemplateResult) {
    (result as ShadyTemplateResult).__renderIntoShadowRoot = renderingIntoShadowRoot;
  }

  // Note, in first scope render, render into a fragment and move to container
  // to preserve outer => inner ordering important for @apply production
  // before consumption.
  // *** This must be done here to support rendering non-templateResults
  // into shadowRoots.
  const renderContainer =
    renderingIntoShadowRoot && !isScopeStyled(name)
      ? document.createDocumentFragment()
      : container;
  litRender(result, renderContainer, options);

  // Ensure styles are scoped if a TemplateResult is *not* being rendered.
  // Note, if a TemplateResult *is* being rendered, scoping is done
  // in `Template._createElement`, before Template parts are created.
  if (renderingIntoShadowRoot && !renderingTemplateResult) {
    ensureStyles(currentScope);
  }
  currentScope = previousScope;
  if (renderContainer !== container) {
    (container as any).$lit$ = (renderContainer as any).$lit$;
    container.insertBefore(renderContainer, options?.renderBefore || null);
  }

  // TODO(sorvell): Decide if we need to call `styleElement` or not.
  // Previously this was called here under these conditions;
  // however, this was incomplete since you must call styleElement with
  // any dynamic changes. Therefore, we'd like to push this to a user concern
  // if possible.
  //
  // if (!hasRendered && renderingIntoShadowRoot) {
  //   window.ShadyCSS!.styleElement((container as ShadowRoot).host);
  // }
};

const ensureStyles = (name: string, template?: HTMLTemplateElement) => {
  if (isScopeStyled(name)) {
    return;
  }
  template =
    template ??
    addStyleToTemplate(
      document.createElement('template'),
      cssForScope(currentScope)
    );
  // Mark this scope as styled.
  styledScopes.add(name);
  // Remove stored data
  scopeCssStore.delete(name);
  window.ShadyCSS!.prepareTemplateStyles(template, name);
};

const addStyleToTemplate = (
  template: HTMLTemplateElement,
  scopeCss?: ScopeCSS
) => {
  if (scopeCss !== undefined) {
    const style = document.createElement('style');
    style.textContent = [...scopeCss.css, ...scopeCss!.adoptedCss].join('\n');
    // Place aggregate style into template. Note, ShadyCSS will remove it
    // if polyfilled ShadowDOM is used.
    if (style !== undefined) {
      template.content.insertBefore(style, template.content.firstChild);
    }
  }
  return template;
};

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
  let templateCache = scopedTemplateCache.get(currentScope);
  if (templateCache === undefined) {
    scopedTemplateCache.set(currentScope, (templateCache = new Map()));
  }
  let template = templateCache.get(strings);
  if (template === undefined) {
    templateCache.set(strings, (template = new ShadyTemplate(result)));
  }
  return template;
}

let currentResult: ShadyTemplateResult;
class ShadyTemplate extends Template {
  constructor(result: TemplateResult) {
    // TODO(sorvell): Decide if Template should store the result to avoid this.
    // We need the `result` in `_createElement` which is called directly
    // from the constructor. Since we can't access this before super, uce
    // a side channel to store the data.
    currentResult = result;
    super(result);
  }
  /**
   * Override to extract style elements from the template
   * and store all style.textContent in the shady scope data.
   */
  _createElement(html: string) {
    //console.log('patched _createElement:', name);
    const template = super._createElement(html);
    window.ShadyCSS!.prepareTemplateDom(template, currentScope);
    const scopeCss = cssForScope(currentScope);
    if (scopeCss !== undefined) {
      // Remove styles and store their textContent.
      const styles = template.content.querySelectorAll('style');
      scopeCss.css.push(
        ...Array.from(styles).map((style) => {
          style.parentNode?.removeChild(style);
          return style.textContent!;
        })
      );
      // Apply styles if this is the result rendering into shadowRoot.
      if (currentResult.__renderIntoShadowRoot) {
        ensureStyles(currentScope, addStyleToTemplate(template, scopeCss));
      }
    }
    return template;
  }
}

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

  Object.defineProperty(NodePart.prototype, '_getTemplate', {
    value: _getTemplate,
    enumerable: true,
    configurable: true,
  });
}
