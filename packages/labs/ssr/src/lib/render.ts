/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElementRenderer} from './lit-element-renderer.js';
import {renderValue} from './render-value.js';

import type {RenderInfo} from './render-value.js';
export type {RenderInfo} from './render-value.js';
import type {RenderResult} from './render-result.js';
export type {RenderResult} from './render-result.js';

/**
 * Renders a lit-html template (or any renderable lit-html value) to a string
 * iterator. Any custom elements encountered will be rendered if a matching
 * ElementRenderer is found.
 *
 * This method is suitable for streaming the contents of the element.
 *
 * @param value Value to render
 * @param renderInfo Optional render context object that should be passed
 *   to any reentrant calls to `render`, e.g. from a `renderShadow` callback
 *   on an ElementRenderer.
 */
export function* render(
  value: unknown,
  renderInfo?: Partial<RenderInfo>
): RenderResult {
  const defaultRenderInfo = {
    elementRenderers: [LitElementRenderer],
    customElementInstanceStack: [],
    customElementHostStack: [],
    deferHydration: false,
  };
  renderInfo = {...defaultRenderInfo, ...renderInfo};
  yield* renderValue(value, renderInfo as RenderInfo);
}
