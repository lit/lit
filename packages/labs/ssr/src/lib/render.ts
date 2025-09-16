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
import {isTemplateResult} from 'lit-html/directive-helpers.js';
import {isHydratable} from './server-template.js';
import {mark, measure} from './util/performance-utils.js';
export type {RenderResult} from './render-result.js';

export type RenderOptions = {
  emitPerformanceMetrics: boolean;
};

const defaultRenderOptions = {
  emitPerformanceMetrics: false,
};

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
  renderInfo?: Partial<RenderInfo>,
  renderOptions?: Partial<RenderOptions>
): RenderResult {
  const options = {...defaultRenderOptions, ...renderOptions};

  const startMark = mark(options.emitPerformanceMetrics, 'ssr-render-start');
  const defaultRenderInfo = {
    elementRenderers: [LitElementRenderer],
    customElementInstanceStack: [],
    customElementHostStack: [],
    eventTargetStack: [],
    slotStack: [],
    deferHydration: false,
  } satisfies RenderInfo;
  renderInfo = {...defaultRenderInfo, ...renderInfo};
  let hydratable = true;
  if (isTemplateResult(value)) {
    hydratable = isHydratable(value);
  }
  yield* renderValue(value, renderInfo as RenderInfo, options, hydratable);

  const endMark = mark(options.emitPerformanceMetrics, 'ssr-rsender-end');
  measure(options.emitPerformanceMetrics, 'ssr-render-complete', {
    start: startMark?.startTime,
    end: endMark?.startTime,
    detail: {
      template: value,
    },
  });
}
