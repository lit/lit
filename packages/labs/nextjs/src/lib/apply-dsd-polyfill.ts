/// <reference lib="dom" />

/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import {LitElement} from 'lit-element';
import {hydrateShadowRoots} from '@webcomponents/template-shadowroot';

declare const litElementHydrateSupport:
  | undefined
  | ((options: {LitElement: typeof LitElement}) => void);

/**
 * Defensively (re-)apply Lit's hydration patches. Turbopack production builds
 * can evaluate `lit-element` before `lit-element-hydrate-support` registers
 * its patcher, causing SSR'd components to render their shadow DOM twice. The
 * patcher installs an own `createRenderRoot` on `LitElement.prototype`; its
 * absence means the patches haven't been applied yet.
 */
const alreadyPatched = Object.prototype.hasOwnProperty.call(
  LitElement.prototype,
  'createRenderRoot'
);
if (typeof litElementHydrateSupport === 'function' && !alreadyPatched) {
  litElementHydrateSupport({LitElement});
}

if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')) {
  hydrateShadowRoots(document.body);
}
