/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {
  direction,
  virtualizerAxis,
  writingMode,
} from '../layouts/shared/Layout.js';

/**
 * Centralized readers for CSS `writing-mode` and `direction`.
 *
 * Some browser engines do not implement these properties on
 * `getComputedStyle()` (the property is absent rather than empty).
 * These readers normalize any unrecognized value — including
 * `undefined`, missing, empty string, or non-canonical strings — to
 * the CSS defaults (`horizontal-tb` / `ltr`). Internal Virtualizer
 * code should always go through these readers rather than reading
 * the computed-style properties directly.
 */

export function readWritingMode(el: Element): writingMode {
  const style = getComputedStyle(el);
  const value = style.writingMode as string | undefined;
  if (
    value === 'horizontal-tb' ||
    value === 'vertical-lr' ||
    value === 'vertical-rl'
  ) {
    return value;
  }
  return 'horizontal-tb';
}

export function readDirection(el: Element): direction {
  const style = getComputedStyle(el);
  const value = style.direction as string | undefined;
  if (value === 'ltr' || value === 'rtl') {
    return value;
  }
  return 'ltr';
}

/**
 * Computes the effective writing-mode that internal Virtualizer
 * coordinate logic should use, given the host's context
 * writing-mode and direction and the active `axis` setting.
 *
 * For `axis: 'block'`, the effective writing-mode is the context
 * writing-mode itself. For `axis: 'inline'`, the inline and block
 * axes are conceptually swapped:
 *
 *   - context `horizontal-tb` ltr → `vertical-lr`
 *   - context `horizontal-tb` rtl → `vertical-rl`
 *   - context `vertical-lr`       → `horizontal-tb`
 *   - context `vertical-rl`       → `horizontal-tb`
 *
 * Internal coordinate logic is sourced from the value this returns
 * rather than from a CSS round-trip on the host element, so that
 * the virtualizer continues to work on engines that don't honor
 * CSS `writing-mode` writes.
 */
export function computeEffectiveWritingMode(
  axis: virtualizerAxis,
  contextWritingMode: writingMode,
  contextDirection: direction
): writingMode {
  if (axis === 'block') {
    return contextWritingMode;
  }
  if (contextWritingMode === 'horizontal-tb') {
    return contextDirection === 'rtl' ? 'vertical-rl' : 'vertical-lr';
  }
  return 'horizontal-tb';
}
