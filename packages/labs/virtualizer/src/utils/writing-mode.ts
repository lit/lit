/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {direction, writingMode} from '../layouts/shared/Layout.js';

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
