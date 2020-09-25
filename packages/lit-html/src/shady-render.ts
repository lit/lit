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

interface RenderOptions {
  readonly renderBefore?: ChildNode | null;
  readonly scope?: string;
}

interface ShadyTemplateResult {
  __renderIntoShadowRoot?: boolean;
  _$litType$?: string;
}

interface NodePartStandIn {
  new (...args: any[]): NodePartStandIn;
  _value: unknown;
  _startNode: ChildNode;
  _endNode: ChildNode | null;
  options: RenderOptions;
  _setValue(value: unknown): void;
  __baseSetValue(value: unknown): void;
}

interface TemplateStandIn {
  new (...args: any[]): TemplateStandIn;
  _createElement(html: string): HTMLTemplateElement;
}

/**
 * lit-html patches. These properties cannot be renamed.
 * * NodePart.prototype._getTemplate
 * * NodePart.prototype._setValue
 */
(globalThis as any)['litHtmlPolyfills'] = ({
  NodePart,
  Template,
}: {
  NodePart: NodePartStandIn;
  Template: TemplateStandIn;
}) => {
  const needsPolyfill = !!(
    window.ShadyCSS !== undefined &&
    (!window.ShadyCSS.nativeShadow || window.ShadyCSS.ApplyShim)
  );

  if (!needsPolyfill) {
    return;
  }

  // console.log(
  //   '%c Making lit-html compatible with ShadyDOM/CSS.',
  //   'color: lightgreen; font-style: italic'
  // );

  const styledScopes: Set<string> = new Set();
  const scopeCssStore: Map<string, string[]> = new Map();
  let currentScope: string;

  const isScopeStyled = (name: string | undefined) =>
    needsPolyfill && name !== undefined ? styledScopes.has(name) : true;

  const cssForScope = (name: string) => {
    if (isScopeStyled(name)) {
      return;
    }
    let scopeCss = scopeCssStore.get(name);
    if (scopeCss === undefined) {
      scopeCssStore.set(name, (scopeCss = []));
    }
    return scopeCss;
  };

  const ensureStyles = (name: string, template: HTMLTemplateElement) => {
    if (isScopeStyled(name)) {
      return;
    }
    // Mark this scope as styled.
    styledScopes.add(name);
    // Remove stored data
    scopeCssStore.delete(name);
    window.ShadyCSS!.prepareTemplateStyles(template, name);
  };

  const scopedTemplateCache = new Map<
    string,
    Map<TemplateStringsArray, TemplateStandIn>
  >();

  // Note, it's ok to subclass Template since it's only used via NodePart.
  let currentResult: ShadyTemplateResult;
  class ShadyTemplate extends Template {
    constructor(result: ShadyTemplateResult) {
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
      const template = super._createElement(html);
      window.ShadyCSS!.prepareTemplateDom(template, currentScope);
      const scopeCss = cssForScope(currentScope);
      if (scopeCss !== undefined) {
        // Remove styles and store textContent.
        const styles = template.content.querySelectorAll('style') as NodeListOf<
          HTMLStyleElement
        >;
        scopeCss.push(
          ...Array.from(styles).map((style) => {
            style.parentNode?.removeChild(style);
            return style.textContent!;
          })
        );
        // Apply styles if this is the result rendering into shadowRoot.
        if (currentResult.__renderIntoShadowRoot) {
          if (scopeCss.length) {
            const style = document.createElement('style');
            style.textContent = scopeCss.join('\n');
            // Place aggregate style into template. Note, ShadyCSS will remove
            // it if polyfilled ShadowDOM is used.
            template.content.insertBefore(style, template.content.firstChild);
          }
          ensureStyles(currentScope, template);
        }
      }
      return template;
    }
  }

  Object.assign(NodePart.prototype, {
    /**
     * Patch to apply gathered css via ShadyCSS. This is done only once per scope.
     */
    __baseSetValue: NodePart.prototype._setValue,
    _setValue(this: NodePartStandIn, value: unknown) {
      const container = this._startNode.parentNode!;
      const renderingIntoShadowRoot = container instanceof ShadowRoot;
      if (!renderingIntoShadowRoot) {
        this.__baseSetValue(value);
      } else {
        const previousScope = currentScope;
        currentScope = this.options.scope ?? '';

        const renderingTemplateResult = !!(value as ShadyTemplateResult)
          ?._$litType$;
        // If result is a TemplateResult decorate it so that when the template
        // is created, styling can be shimmed.
        if (renderingTemplateResult) {
          (value as ShadyTemplateResult).__renderIntoShadowRoot = renderingIntoShadowRoot;
        }

        // Note, in first scope render, render into a fragment and move to container
        // to preserve outer => inner ordering important for @apply production
        // before consumption.
        // *** This must be done here in order to support rendering
        // non-templateResults into shadowRoots.
        let renderContainer: DocumentFragment | undefined = undefined;
        const startNode = this._startNode;
        const endNode = this._endNode;
        if (renderingIntoShadowRoot && !isScopeStyled(currentScope)) {
          renderContainer = document.createDocumentFragment();
          renderContainer.appendChild(document.createComment(''));
          // Temporarily swizzle tracked nodes so the `__insert` is correct.
          this._startNode = this._endNode = renderContainer.firstChild!;
        }
        this.__baseSetValue(value);

        // Ensure styles are scoped if a TemplateResult is *not* being rendered.
        // Note, if a TemplateResult *is* being rendered, scoping is done
        // in `Template._createElement`, before Template parts are created.
        if (renderingIntoShadowRoot && !renderingTemplateResult) {
          ensureStyles(currentScope, document.createElement('template'));
        }
        currentScope = previousScope;
        // If necessary move the rendered DOM into the real container.
        if (renderContainer !== undefined) {
          // Note, this is the temporary startNode.
          renderContainer.removeChild(renderContainer.lastChild!);
          container.insertBefore(
            renderContainer,
            this.options?.renderBefore || null
          );
          // Un-swizzle tracked nodes.
          this._startNode = startNode;
          this._endNode = endNode;
        }
      }
    },

    /**
     * Patch NodePart._getTemplate to look up templates in a cache bucketed
     * by element name.
     */
    _getTemplate(strings: TemplateStringsArray, result: ShadyTemplateResult) {
      let templateCache = scopedTemplateCache.get(currentScope);
      if (templateCache === undefined) {
        scopedTemplateCache.set(currentScope, (templateCache = new Map()));
      }
      let template = templateCache.get(strings);
      if (template === undefined) {
        templateCache.set(strings, (template = new ShadyTemplate(result)));
      }
      return template;
    },
  });
};
