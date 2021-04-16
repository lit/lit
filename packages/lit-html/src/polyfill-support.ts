/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * lit-html patch to support browsers without native web components.
 *
 * This module should be used in addition to loading the web components
 * polyfills via @webcomponents/webcomponentjs. When using those polyfills
 * support for polyfilled Shadow DOM is automatic via the ShadyDOM polyfill.
 * Scoping classes are added to DOM nodes to facilitate CSS scoping that
 * simulates the style scoping Shadow DOM provides. ShadyDOM does this scoping
 * to all elements added to the DOM. This module provides an important
 * optimization for this process by pre-scoping lit-html template
 * DOM. This means ShadyDOM does not have to scope each instance of the
 * template DOM. Instead, each template is scoped only once.
 *
 * Creating scoped CSS is not covered by this module. It is, however, integrated
 * into the lit-element and @lit/reactive-element packages. See the ShadyCSS docs
 * for how to apply scoping to CSS:
 * https://github.com/webcomponents/polyfills/tree/master/packages/shadycss#usage.
 *
 * @packageDocumentation
 */

interface RenderOptions {
  readonly renderBefore?: ChildNode | null;
  scope?: string;
}

interface ShadyTemplateResult {
  strings: TemplateStringsArray;
  _$litType$?: string;
}

// Note, this is a dummy type as the full type here is big.
interface Directive {
  __directive?: Directive;
}

interface DirectiveParent {
  _$parent?: DirectiveParent;
  __directive?: Directive;
  __directives?: Array<Directive | undefined>;
}

interface PatchableChildPartConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): PatchableChildPart;
}

interface PatchableChildPart {
  __directive?: Directive;
  _$committedValue: unknown;
  _$startNode: ChildNode;
  _$endNode: ChildNode | null;
  options: RenderOptions;
  _$setValue(value: unknown, directiveParent: DirectiveParent): void;
  _$getTemplate(result: ShadyTemplateResult): HTMLTemplateElement;
}

interface PatchableTemplate {
  el: HTMLTemplateElement;
}

interface PatchableTemplateConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): PatchableTemplate;
  createElement(html: string, options?: RenderOptions): HTMLTemplateElement;
}

interface PatchableTemplateInstance {
  _$template: PatchableTemplate;
}

// Scopes that have had styling prepared. Note, must only be done once per
// scope.
const styledScopes: Set<string> = new Set();
// Map of css per scope. This is collected during first scope render, used when
// styling is prepared, and then discarded.
const scopeCssStore: Map<string, string[]> = new Map();

const ENABLE_SHADYDOM_NOPATCH = true;

/**
 * lit-html patches. These properties cannot be renamed.
 * * ChildPart.prototype._$getTemplate
 * * ChildPart.prototype._$setValue
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)['litHtmlPlatformSupport'] ??= (
  Template: PatchableTemplateConstructor,
  ChildPart: PatchableChildPartConstructor
) => {
  // polyfill-support is only needed if ShadyCSS or the ApplyShim is in use
  // We test at the point of patching, which makes it safe to load
  // webcomponentsjs and polyfill-support in either order
  if (
    window.ShadyCSS === undefined ||
    (window.ShadyCSS.nativeShadow && !window.ShadyCSS.ApplyShim)
  ) {
    return;
  }

  // console.log(
  //   '%c Making lit-html compatible with ShadyDOM/CSS.',
  //   'color: lightgreen; font-style: italic'
  // );

  const wrap =
    ENABLE_SHADYDOM_NOPATCH &&
    window.ShadyDOM?.inUse &&
    window.ShadyDOM?.noPatch === true
      ? window.ShadyDOM!.wrap
      : (node: Node) => node;

  const needsPrepareStyles = (name: string | undefined) =>
    name !== undefined && !styledScopes.has(name);

  const cssForScope = (name: string) => {
    let scopeCss = scopeCssStore.get(name);
    if (scopeCss === undefined) {
      scopeCssStore.set(name, (scopeCss = []));
    }
    return scopeCss;
  };

  const prepareStyles = (name: string, template: HTMLTemplateElement) => {
    // Get styles
    const scopeCss = cssForScope(name);
    const hasScopeCss = scopeCss.length !== 0;
    if (hasScopeCss) {
      const style = document.createElement('style');
      style.textContent = scopeCss.join('\n');
      // Note, it's important to add the style to the *end* of the template so
      // it doesn't mess up part indices.
      template.content.appendChild(style);
    }
    // Mark this scope as styled.
    styledScopes.add(name);
    // Remove stored data since it's no longer needed.
    scopeCssStore.delete(name);
    // ShadyCSS removes scopes and removes the style under ShadyDOM and leaves
    // it under native Shadow DOM
    window.ShadyCSS!.prepareTemplateStyles(template, name);
    // Note, under native Shadow DOM, the style is added to the beginning of the
    // template. It must be moved to the *end* of the template so it doesn't
    // mess up part indices.
    if (hasScopeCss && window.ShadyCSS!.nativeShadow) {
      template.content.appendChild(template.content.querySelector('style')!);
    }
  };

  const scopedTemplateCache = new Map<
    string | undefined,
    Map<TemplateStringsArray, PatchableTemplate>
  >();

  /**
   * Override to extract style elements from the template
   * and store all style.textContent in the shady scope data.
   * Note, it's ok to patch Template since it's only used via ChildPart.
   */
  const originalCreateElement = Template.createElement;
  Template.createElement = function (html: string, options?: RenderOptions) {
    const element = originalCreateElement.call(Template, html, options);
    const scope = options?.scope;
    if (scope !== undefined) {
      if (!window.ShadyCSS!.nativeShadow) {
        window.ShadyCSS!.prepareTemplateDom(element, scope);
      }
      const scopeCss = cssForScope(scope);
      // Remove styles and store textContent.
      const styles = element.content.querySelectorAll(
        'style'
      ) as NodeListOf<HTMLStyleElement>;
      // Store the css in this template in the scope css and remove the <style>
      // from the template _before_ the node-walk captures part indices
      scopeCss.push(
        ...Array.from(styles).map((style) => {
          style.parentNode?.removeChild(style);
          return style.textContent!;
        })
      );
    }
    return element;
  };

  const renderContainer = document.createDocumentFragment();
  const renderContainerMarker = document.createComment('');

  const childPartProto = ChildPart.prototype;
  /**
   * Patch to apply gathered css via ShadyCSS. This is done only once per scope.
   */
  const setValue = childPartProto._$setValue;
  childPartProto._$setValue = function (
    this: PatchableChildPart,
    value: unknown,
    directiveParent: DirectiveParent = this
  ) {
    const container = wrap(this._$startNode).parentNode!;
    const scope = this.options?.scope;
    if (container instanceof ShadowRoot && needsPrepareStyles(scope)) {
      // Note, @apply requires outer => inner scope rendering on initial
      // scope renders to apply property values correctly. Style preparation
      // is tied to rendering into `shadowRoot`'s and this is typically done by
      // custom elements. If this is done in `connectedCallback`, as is typical,
      // the code below ensures the right order since content is rendered
      // into a fragment first so the hosting element can prepare styles first.
      // If rendering is done in the constructor, this won't work, but that's
      // not supported in ShadyDOM anyway.
      const startNode = this._$startNode;
      const endNode = this._$endNode;

      // Temporarily move this part into the renderContainer.
      renderContainer.appendChild(renderContainerMarker);
      this._$startNode = renderContainerMarker;
      this._$endNode = null;

      // Note, any nested template results render here and their styles will
      // be extracted and collected.
      setValue.call(this, value, directiveParent);

      // Get the template for this result or create a dummy one if a result
      // is not being rendered.
      const template = (value as ShadyTemplateResult)?._$litType$
        ? (this._$committedValue as PatchableTemplateInstance)._$template.el
        : document.createElement('template');
      prepareStyles(scope!, template);

      // Note, this is the temporary startNode.
      renderContainer.removeChild(renderContainerMarker);
      // When using native Shadow DOM, include prepared style in shadowRoot.
      if (window.ShadyCSS?.nativeShadow) {
        const style = template.content.querySelector('style');
        if (style !== null) {
          renderContainer.appendChild(style.cloneNode(true));
        }
      }
      container.insertBefore(renderContainer, endNode);
      // Move part back to original container.
      this._$startNode = startNode;
      this._$endNode = endNode;
    } else {
      setValue.call(this, value, directiveParent);
    }
  };

  /**
   * Patch ChildPart._$getTemplate to look up templates in a cache bucketed
   * by element name.
   */
  childPartProto._$getTemplate = function (
    this: PatchableChildPart,
    result: ShadyTemplateResult
  ) {
    const scope = this.options?.scope;
    let templateCache = scopedTemplateCache.get(scope);
    if (templateCache === undefined) {
      scopedTemplateCache.set(scope, (templateCache = new Map()));
    }
    let template = templateCache.get(result.strings);
    if (template === undefined) {
      templateCache.set(
        result.strings,
        (template = new Template(result, this.options))
      );
    }
    return template;
  };
};

if (ENABLE_SHADYDOM_NOPATCH) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  (globalThis as any)[
    'litHtmlPlatformSupport'
  ].noPatchSupported = ENABLE_SHADYDOM_NOPATCH;
}
