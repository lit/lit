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
 * UpdatingElement patch to support browsers without native web components.
 *
 * @packageDocumentation
 */

const needsPlatformSupport = !!(
  window.ShadyCSS !== undefined &&
  (!window.ShadyCSS.nativeShadow || window.ShadyCSS.ApplyShim)
);

interface RenderOptions {
  readonly renderBefore?: ChildNode | null;
  scope?: string;
}

const SCOPED = '__scoped';

type CSSResults = Array<{cssText: string} | CSSStyleSheet>;

interface PatchableUpdatingElementConstructor {
  [SCOPED]: boolean;
  elementStyles: CSSResults;
  shadowRootOptions: ShadowRootInit;
}

interface PatchableUpdatingElement extends HTMLElement {
  new (...args: any[]): PatchableUpdatingElement;
  constructor: PatchableUpdatingElementConstructor;
  connectedCallback(): void;
  _baseConnectedCallback(): void;
  hasUpdated: boolean;
  _afterUpdate(changedProperties: unknown): void;
  _baseAfterUpdate(changedProperties: unknown): void;
  createRenderRoot(): Element | ShadowRoot;
  _baseCreateRenderRoot(): Element | ShadowRoot;
  _renderOptions: RenderOptions;
}

(globalThis as any)['updatingElementPlatformSupport'] = ({
  UpdatingElement,
}: {
  UpdatingElement: PatchableUpdatingElement;
}) => {
  if (!needsPlatformSupport) {
    return;
  }

  // console.log(
  //   '%c Making UpdatingElement compatible with ShadyDOM/CSS.',
  //   'color: lightgreen; font-style: italic'
  // );

  const elementProto = UpdatingElement.prototype;

  /**
   * Patch to apply adoptedStyleSheets via ShadyCSS
   */
  elementProto._baseCreateRenderRoot = elementProto.createRenderRoot;
  elementProto.createRenderRoot = function (this: PatchableUpdatingElement) {
    // Pass the scope to render options so that it gets to lit-html for proper
    // scoping via ShadyCSS. This is needed under Shady and also Shadow DOM,
    // due to @apply.
    // const name = (this._renderOptions.scope = this.localName);
    // If using native Shadow DOM must adoptStyles normally,
    // otherwise do nothing.
    if (window.ShadyCSS!.nativeShadow) {
      return this._baseCreateRenderRoot();
    } else {
      if (!this.constructor.hasOwnProperty(SCOPED)) {
        (this.constructor as PatchableUpdatingElementConstructor)[
          SCOPED
        ] = true;
        // Use ShadyCSS's `prepareAdoptedCssText` to shim adoptedStyleSheets.
        const css = (this
          .constructor as PatchableUpdatingElementConstructor).elementStyles.map(
          (v) =>
            v instanceof CSSStyleSheet
              ? Array.from(v.cssRules).reduce(
                  (a: string, r: CSSRule) => (a += r.cssText),
                  ''
                )
              : v.cssText
        );
        window.ShadyCSS?.ScopingShim?.prepareAdoptedCssText(css, name);
      }
      return (
        this.shadowRoot ??
        this.attachShadow(
          (this.constructor as PatchableUpdatingElementConstructor)
            .shadowRootOptions
        )
      );
    }
  };

  /**
   * Patch connectedCallback to apply ShadyCSS custom properties shimming.
   */
  elementProto._baseConnectedCallback = elementProto.connectedCallback;
  elementProto.connectedCallback = function (this: PatchableUpdatingElement) {
    this._baseConnectedCallback();
    // Note, must do first update separately so that we're ensured
    // that rendering has completed before calling this.
    if (this.hasUpdated) {
      window.ShadyCSS!.styleElement(this);
    }
  };

  /**
   * Patch update to apply ShadyCSS custom properties shimming for first
   * update.
   */
  elementProto._baseAfterUpdate = elementProto._afterUpdate;
  elementProto.update = function (
    this: PatchableUpdatingElement,
    changedProperties: unknown
  ) {
    const isFirstUpdate = !this.hasUpdated;
    this._baseAfterUpdate(changedProperties);
    // Note, must do first update here so rendering has completed before
    // calling this and styles are correct by updated/firstUpdated.
    if (isFirstUpdate) {
      window.ShadyCSS!.styleElement(this);
    }
  };
};
