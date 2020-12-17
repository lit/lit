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
 * This module should be used in addition to loading the web components
 * polyfills via @webcomponents/webcomponentjs. When using those polyfills
 * support for polyfilled Shadow DOM is automatic via the ShadyDOM polyfill, but
 * support for Shadow DOM like css scoping is opt-in. This module uses ShadyCSS
 * to scope styles defined via the `static styles` property and styles included
 * in the render method. There are some limitations to be aware of:
 * * only styles that are included in the first render of a component are scoped.
 * * In addition, support for the deprecated `@apply` feature of ShadyCSS is
 * only provided for styles included in the template and not styles provided
 * via the static styles property.
 * * Lit parts cannot be used in styles included in the template.
 *
 * @packageDocumentation
 */

import '@lit/reactive-element/platform-support.js';
import 'lit-html/platform-support.js';

const needsPlatformSupport = !!(
  window.ShadyCSS !== undefined &&
  (!window.ShadyCSS.nativeShadow || window.ShadyCSS.ApplyShim)
);

interface RenderOptions {
  readonly renderBefore?: ChildNode | null;
  scope?: string;
}

interface PatchableLitElementConstructor {
  _$handlesPrepareStyles?: boolean;
}

interface PatchableLitElement extends HTMLElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): PatchableLitElement;
  constructor: PatchableLitElementConstructor;
  createRenderRoot(): Element | ShadowRoot;
  _$renderOptions: RenderOptions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)['litElementPlatformSupport'] ??= ({
  LitElement,
}: {
  LitElement: PatchableLitElement;
}) => {
  if (!needsPlatformSupport) {
    return;
  }

  // console.log(
  //   '%c Making LitElement compatible with ShadyDOM/CSS.',
  //   'color: lightgreen; font-style: italic'
  // );

  ((LitElement as unknown) as PatchableLitElementConstructor)._$handlesPrepareStyles = true;

  /**
   * Patch to apply adoptedStyleSheets via ShadyCSS
   */
  const litElementProto = LitElement.prototype;
  const createRenderRoot = litElementProto.createRenderRoot;
  litElementProto.createRenderRoot = function (this: PatchableLitElement) {
    // Pass the scope to render options so that it gets to lit-html for proper
    // scoping via ShadyCSS. This is needed under Shady and also Shadow DOM,
    // due to @apply.
    this._$renderOptions.scope = this.localName;
    return createRenderRoot.call(this);
  };
};
