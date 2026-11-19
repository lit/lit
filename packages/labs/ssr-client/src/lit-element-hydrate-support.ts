/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * LitElement support for hydration of content rendered using lit-ssr.
 *
 * @packageDocumentation
 */

import type {PropertyValues} from '@lit/reactive-element';
import {render, RenderOptions} from 'lit-html';
import {hydrate} from './lib/hydrate-lit-html.js';

// Keep consistent with `@lit-labs/ssr-dom-shim`
const HYDRATE_INTERNALS_ATTR_PREFIX = 'hydrate-internals-';

interface PatchableLitElement extends HTMLElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): PatchableLitElement;
  enableUpdating(requestedUpdate?: boolean): void;
  createRenderRoot(): Element | ShadowRoot;
  renderRoot: HTMLElement | DocumentFragment;
  render(): unknown;
  renderOptions: RenderOptions;
  hasUpdated: boolean;
  _$needsHydration: boolean;
}

// The root ChildPart created by `render()`/`hydrate()` is stored on the
// render root as `_$litPart$`. Async directives below it track their
// connection state through it via `setConnected()`. The render root may not
// exist yet if the element has not been enabled (e.g. while it still has a
// `defer-hydration` attribute), in which case there is no part to update.
const getRootPart = (element: PatchableLitElement) =>
  // This property needs to remain unminified.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (element.renderRoot as any)?.['_$litPart$'] as
    | {setConnected(isConnected: boolean): void}
    | undefined;

globalThis.litElementHydrateSupport = ({
  LitElement,
}: {
  LitElement: PatchableLitElement;
}) => {
  const observedAttributes = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(LitElement),
    'observedAttributes'
  )!.get!;

  // Add `defer-hydration` to observedAttributes
  Object.defineProperty(LitElement, 'observedAttributes', {
    get() {
      return [...observedAttributes.call(this), 'defer-hydration'];
    },
  });

  // Enable element when 'defer-hydration' attribute is removed by calling the
  // super.connectedCallback()
  const attributeChangedCallback =
    LitElement.prototype.attributeChangedCallback;
  LitElement.prototype.attributeChangedCallback = function (
    name: string,
    old: string | null,
    value: string | null
  ) {
    if (name === 'defer-hydration' && value === null) {
      connectedCallback.call(this);
    }
    attributeChangedCallback.call(this, name, old, value);
  };

  // Override `connectedCallback` to capture whether we need hydration, and
  // defer `super.connectedCallback()` if the 'defer-hydration' attribute is set
  const connectedCallback = LitElement.prototype.connectedCallback;
  LitElement.prototype.connectedCallback = function (
    this: PatchableLitElement
  ) {
    // If the outer scope of this element has not yet been hydrated, wait until
    // 'defer-hydration' attribute has been removed to enable
    if (!this.hasAttribute('defer-hydration')) {
      connectedCallback.call(this);
    }
    // LitElement tracks the connection state of async directives through the
    // root part created in `update()`, but hydration bypasses that path, so
    // propagate the connection state to the hydrated root part here.
    getRootPart(this)?.setConnected(true);
  };

  // Override `disconnectedCallback` to propagate the disconnection to the
  // hydrated root part, so async directives are disconnected. LitElement's
  // own `disconnectedCallback` does this via the root part created in
  // `update()`, but hydration bypasses that path, so without this async
  // directives never observe the element being disconnected.
  const disconnectedCallback = LitElement.prototype.disconnectedCallback;
  LitElement.prototype.disconnectedCallback = function (
    this: PatchableLitElement
  ) {
    disconnectedCallback.call(this);
    getRootPart(this)?.setConnected(false);
  };

  // If we've been server-side rendered, just return `this.shadowRoot`, don't
  // call the base implementation, which would also adopt styles (for now)
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
  const update = Object.getPrototypeOf(LitElement.prototype).update;
  LitElement.prototype.update = function (
    this: PatchableLitElement,
    changedProperties: PropertyValues
  ) {
    const value = this.render();
    // Mirror LitElement.update(): capture the connection state before the
    // first render so async directives see `isConnected === false` when the
    // element is updated while disconnected. Without this, hydration creates
    // the root part connected by default and directives like `ref()` fire
    // while the element is detached.
    if (!this.hasUpdated) {
      this.renderOptions.isConnected = this.isConnected;
    }
    // Since this is a patch, we can't call super.update(), so we capture
    // it off the proto chain and call it instead
    update.call(this, changedProperties);
    if (this._$needsHydration) {
      this._$needsHydration = false;
      // Remove aria attributes added by internals shim during SSR
      for (const attrName of this.getAttributeNames()) {
        if (attrName.startsWith(HYDRATE_INTERNALS_ATTR_PREFIX)) {
          const ariaAttr = attrName.slice(HYDRATE_INTERNALS_ATTR_PREFIX.length);
          this.removeAttribute(ariaAttr);
          this.removeAttribute(attrName);
        }
      }
      hydrate(value, this.renderRoot, this.renderOptions);
    } else {
      render(value, this.renderRoot, this.renderOptions);
    }
  };
};
