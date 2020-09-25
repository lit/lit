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
  scope?: string;
}

const SCOPE_KEY = '__localName';

interface LitElementConstructorStandIn {
  [SCOPE_KEY]: string;
  render(
    result: unknown,
    container: HTMLElement | DocumentFragment,
    options: RenderOptions
  ): void;
  __render(
    result: unknown,
    container: HTMLElement | DocumentFragment,
    options: RenderOptions
  ): void;
}

interface LitElementStandIn extends HTMLElement {
  new (...args: any[]): LitElementStandIn;
  constructor: LitElementConstructorStandIn;
  connectedCallback(): void;
  __baseConnectedCallback(): void;
  hasUpdated: boolean;
  update(changedProperties: unknown): void;
  __baseUpdate(changedProperties: unknown): void;
}

(globalThis as any)['litElementPolyfills'] = ({
  LitElement,
}: {
  LitElement: LitElementStandIn;
}) => {
  const needsPolyfill = !!(
    window.ShadyCSS !== undefined &&
    (!window.ShadyCSS.nativeShadow || window.ShadyCSS.ApplyShim)
  );

  if (!needsPolyfill) {
    return;
  }

  // console.log(
  //   '%c Making LitElement compatible with ShadyDOM/CSS.',
  //   'color: lightgreen; font-style: italic'
  // );

  /**
   * Patch `render` to include scope.
   */
  Object.assign(LitElement, {
    __render: ((LitElement as unknown) as LitElementConstructorStandIn).render,
    render(
      this: LitElementConstructorStandIn,
      result: unknown,
      container: HTMLElement | DocumentFragment,
      options: RenderOptions
    ) {
      options.scope = this[SCOPE_KEY];
      this.__render(result, container, options);
    },
  });

  /**
   * Patch to initialize the `scopeData` for the element.
   * The scope data includes:
   * * name: element name
   * * css: array of cssText to apply
   * * isStyled: boolean indicating if styling has been applied
   */
  Object.assign(LitElement.prototype, {
    adoptStyles(
      this: LitElementStandIn,
      styles: Array<{cssText: string} | CSSStyleSheet>
    ) {
      if (this.constructor.hasOwnProperty(SCOPE_KEY)) {
        return;
      }
      const name = (this.constructor[SCOPE_KEY] = this.localName);
      const css = styles.map((v) =>
        v instanceof CSSStyleSheet
          ? Array.from(v.cssRules).reduce(
              (a: string, r: CSSRule) => (a += r.cssText),
              ''
            )
          : v.cssText
      );
      window.ShadyCSS?.ScopingShim?.prepareAdoptedCssText(css, name);
    },

    /**
     * Patch connectedCallback to apply ShadyCSS custom properties shimming.
     */
    __baseConnectedCallback: LitElement.prototype.connectedCallback,
    connectedCallback(this: LitElementStandIn) {
      this.__baseConnectedCallback();
      // Note, must do first update separately so that we're ensured
      // that rendering has completed before calling this.
      if (this.hasUpdated) {
        window.ShadyCSS!.styleElement(this);
      }
    },

    /**
     * Patch update to apply ShadyCSS custom properties shimming for first update.
     */
    __baseUpdate: LitElement.prototype.update,
    update(this: LitElementStandIn, changedProperties: unknown) {
      const isFirstUpdate = !this.hasUpdated;
      this.__baseUpdate(changedProperties);
      // Note, must do first update here so rendering has completed before
      // calling this and styles are correct by updated/firstUpdated.
      if (isFirstUpdate) {
        window.ShadyCSS!.styleElement(this);
      }
    },
  });
};
