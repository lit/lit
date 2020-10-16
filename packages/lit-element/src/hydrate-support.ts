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
 * LitElement support for hydration of content rendered using lit-ssr.
 *
 * @packageDocumentation
 */

import {RenderOptions} from 'lit-html';
import {hydrate} from 'lit-html/hydrate.js';

interface PatchableLitElement extends HTMLElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): PatchableLitElement;
  createRenderRoot(): Element | ShadowRoot;
  _needsHydration: boolean;
  _renderImpl(
    value: unknown,
    root: HTMLElement | DocumentFragment,
    options: RenderOptions
  ): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)['litElementHydrateSupport'] = ({
  LitElement,
}: {
  LitElement: PatchableLitElement;
}) => {
  // Capture whether we need hydration or not
  const createRenderRoot = LitElement.prototype.createRenderRoot;
  LitElement.prototype.createRenderRoot = function () {
    if (this.shadowRoot) {
      this._needsHydration = true;
      return this.shadowRoot;
    } else {
      return createRenderRoot.call(this);
    }
  };

  // Hydrate on first render when needed
  const render = LitElement.prototype._renderImpl;
  LitElement.prototype._renderImpl = function (
    value: unknown,
    root: HTMLElement | DocumentFragment,
    options: RenderOptions
  ) {
    if (this._needsHydration) {
      this._needsHydration = false;
      hydrate(value, root, options);
    } else {
      render.call(this, value, root, options);
    }
  };
};
