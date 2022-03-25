/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * LitElement patch to support browsers without native web components in
 * conjunction with an ahead-of-time compiler.
 *
 * @packageDocumentation
 */

import '@lit/reactive-element/polyfill-support.js';

declare class PatchableLitElement extends HTMLElement {
  static createProperty(name: PropertyKey, options: {attribute: boolean}): void;
  createRenderRoot(): Element | ShadowRoot;
}

// Note, explicitly use `var` here so that this can be re-defined when
// bundled.
// eslint-disable-next-line no-var
var DEV_MODE = true;

const polyfillSupport = ({
  LitElement,
}: {
  LitElement: typeof PatchableLitElement;
}) => {
  LitElement.createProperty('__renderSlots', {attribute: false});
  LitElement.prototype.createRenderRoot = function createRenderRoot() {
    return this;
  };
};

if (DEV_MODE) {
  globalThis.litElementPolyfillSupportDevMode ??= polyfillSupport;
} else {
  globalThis.litElementPolyfillSupport ??= polyfillSupport;
}
