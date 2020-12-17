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

import {PropertyValues, ReactiveElement} from '@lit/reactive-element';
import {render} from 'lit-html';
import {hydrate} from 'lit-html/hydrate.js';

interface PatchableLitElement extends HTMLElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): PatchableLitElement;
  createRenderRoot(): Element | ShadowRoot;
  _$needsHydration: boolean;
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
      this._$needsHydration = true;
      return this.shadowRoot;
    } else {
      return createRenderRoot.call(this);
    }
  };

  // Hydrate on first update when needed
  LitElement.prototype.update = function (changedProperties: PropertyValues) {
    const value = this.render();
    // Since this is a patch, we can't call super.update()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ReactiveElement.prototype as any).update.call(this, changedProperties);
    if (this._$needsHydration) {
      this._$needsHydration = false;
      hydrate(value, this.renderRoot, this._$renderOptions);
    } else {
      render(value, this.renderRoot, this._$renderOptions);
    }
  };
};
