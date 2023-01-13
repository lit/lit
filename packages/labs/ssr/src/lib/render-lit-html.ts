/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {render as _render} from './render.js';
import type {RenderInfo as _RenderInfo} from './render-value.js';
import type {RenderResult as _RenderResult} from './render-result.js';

/**
 * @deprecated Ability to import from `@lit-labs/ssr/lib/render-lit-html.js`
 * will be removed in a future release. Import from `@lit-labs/ssr` instead.
 */
export const render = _render;

/**
 * @deprecated Ability to import from `@lit-labs/ssr/lib/render-lit-html.js`
 * will be removed in a future release. Import from `@lit-labs/ssr` instead.
 */
export type RenderInfo = _RenderInfo;

/**
 * @deprecated Ability to import from `@lit-labs/ssr/lib/render-lit-html.js`
 * will be removed in a future release. Import from `@lit-labs/ssr` instead.
 */
export type RenderResult = _RenderResult;
