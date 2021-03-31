/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
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

import '@lit/reactive-element/polyfill-support.js';
import 'lit-html/polyfill-support.js';

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
  renderOptions: RenderOptions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)['litElementPlatformSupport'] ??= ({
  LitElement,
}: {
  LitElement: PatchableLitElement;
}) => {
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
    this.renderOptions.scope = this.localName;
    return createRenderRoot.call(this);
  };
};
