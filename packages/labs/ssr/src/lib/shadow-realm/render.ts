/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ThunkedRenderResult} from '../render-result.js';
import {shadowRealmRenders} from './shadow-realm.js';

/**
 * Renders a lit-html template (or any renderable lit-html value) to a thunk
 * array. Any custom elements encountered will be rendered if a matching
 * ElementRenderer is found.
 *
 * This method is suitable for streaming the contents of the element.
 *
 * When consuming the result, thunks *must* be called in order to obtain their
 * values. If thunks are not called, or not called in the correct order, the
 * output will be incorrect.
 *
 * @param value Value to render
 * @param renderInfo Optional render context object that should be passed to any
 *   reentrant calls to `render`, e.g. from a `renderShadow` callback on an
 *   ElementRenderer.
 */
export function renderThunked(
  value: unknown,
  shadowRealm: ShadowRealm
): ThunkedRenderResult {
  return shadowRealmRenders.get(shadowRealm)!(JSON.stringify(value));
}
