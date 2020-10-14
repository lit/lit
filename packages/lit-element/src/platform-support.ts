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

import 'updating-element/platform-support.js';
import 'lit-html/platform-support.js';

const needsPlatformSupport = !!(
  window.ShadyCSS !== undefined &&
  (!window.ShadyCSS.nativeShadow || window.ShadyCSS.ApplyShim)
);

interface RenderOptions {
  readonly renderBefore?: ChildNode | null;
  scope?: string;
}

const HAS_PLATFORM_SUPPORT = '_hasPlatformSupport';

interface PatchableLitElementConstructor {
  [HAS_PLATFORM_SUPPORT]?: boolean;
  _handlesPrepareStyles?: boolean;
}

interface PatchableLitElement extends HTMLElement {
  new (...args: any[]): PatchableLitElement;
  constructor: PatchableLitElementConstructor;
  createRenderRoot(): Element | ShadowRoot;
  _renderOptions: RenderOptions;
}

(globalThis as any)['litElementPlatformSupport'] = ({
  LitElement,
}: {
  LitElement: PatchableLitElement;
}) => {
  if (
    !needsPlatformSupport ||
    LitElement.hasOwnProperty(HAS_PLATFORM_SUPPORT)
  ) {
    return;
  }

  // console.log(
  //   '%c Making LitElement compatible with ShadyDOM/CSS.',
  //   'color: lightgreen; font-style: italic'
  // );

  ((LitElement as unknown) as PatchableLitElementConstructor)._handlesPrepareStyles = true;

  /**
   * Patch to apply adoptedStyleSheets via ShadyCSS
   */
  const litElementProto = LitElement.prototype;
  const createRenderRoot = litElementProto.createRenderRoot;
  litElementProto.createRenderRoot = function (this: PatchableLitElement) {
    // Pass the scope to render options so that it gets to lit-html for proper
    // scoping via ShadyCSS. This is needed under Shady and also Shadow DOM,
    // due to @apply.
    this._renderOptions.scope = this.localName;
    return createRenderRoot.call(this);
  };
};
