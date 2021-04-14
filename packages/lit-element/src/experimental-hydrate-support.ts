/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * LitElement support for hydration of content rendered using lit-ssr.
 *
 * @packageDocumentation
 */

import {PropertyValues, ReactiveElement} from '@lit/reactive-element';
import {render, RenderOptions} from 'lit-html';
import {hydrate} from 'lit-html/experimental-hydrate.js';

interface PatchableLitElement extends HTMLElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): PatchableLitElement;
  createRenderRoot(): Element | ShadowRoot;
  renderRoot: Element | ShadowRoot;
  render(): unknown;
  renderOptions: RenderOptions;
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
  LitElement.prototype.createRenderRoot = function (this: PatchableLitElement) {
    if (this.shadowRoot) {
      this._$needsHydration = true;
      return this.shadowRoot;
    } else {
      return createRenderRoot.call(this);
    }
  };

  // Hydrate on first update when needed
  LitElement.prototype.update = function (
    this: PatchableLitElement,
    changedProperties: PropertyValues
  ) {
    const value = this.render();
    // Since this is a patch, we can't call super.update()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ReactiveElement.prototype as any).update.call(this, changedProperties);
    if (this._$needsHydration) {
      this._$needsHydration = false;
      hydrate(value, this.renderRoot, this.renderOptions);
    } else {
      render(value, this.renderRoot as HTMLElement, this.renderOptions);
    }
  };
};
