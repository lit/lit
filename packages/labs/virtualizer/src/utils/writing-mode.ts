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
 * Lazily detects whether the host engine actually honors CSS
 * `writing-mode`. Some engines accept the property syntactically and
 * report it back via `getComputedStyle`, but never apply it to layout;
 * others omit the property entirely. The probe attaches a small
 * element to `document.body`, toggles `writing-mode: vertical-lr` on
 * it, and verifies BOTH:
 *
 *   1. `getComputedStyle` round-trips the value.
 *   2. The element's bounding rect rotates accordingly (a wide-short
 *      box of inline content becomes tall-narrow).
 *
 * Conformance only counts when both checks pass; this catches engines
 * that report the value but never apply it.
 *
 * Result is cached at module scope after the first successful probe.
 * If `document.body` is not yet available, returns `true` (optimistic
 * default) and does not cache, so a later call will re-probe.
 */
let _cachedConformance: boolean | null = null;

export function isWritingModeConforming(): boolean {
  if (_cachedConformance !== null) {
    return _cachedConformance;
  }
  if (typeof document === 'undefined' || !document.body) {
    // SSR / pre-attach: don't poison the cache.
    return true;
  }
  const probe = document.createElement('div');
  probe.style.cssText =
    'position: absolute; left: -9999px; top: -9999px; ' +
    'visibility: hidden; width: auto; height: auto; ' +
    'padding: 0; margin: 0; border: 0; font-size: 16px; ' +
    'line-height: 1; white-space: nowrap;';
  // Inline content with a known horizontal extent in horizontal-tb;
  // when the box rotates to vertical-lr the extent becomes vertical.
  probe.textContent = 'AAAAAAAAAA';
  document.body.appendChild(probe);
  try {
    const horizontal = probe.getBoundingClientRect();
    probe.style.writingMode = 'vertical-lr';
    const stringRoundTrip =
      getComputedStyle(probe).writingMode === 'vertical-lr';
    const vertical = probe.getBoundingClientRect();
    const layoutRotated =
      horizontal.width > horizontal.height && vertical.height > vertical.width;
    _cachedConformance = stringRoundTrip && layoutRotated;
  } finally {
    probe.remove();
  }
  return _cachedConformance;
}

/**
 * Test-only hook: clear the cached conformance result so the next
 * call to `isWritingModeConforming()` re-probes. Production code
 * should never need this.
 */
export function _resetWritingModeConformanceForTesting(): void {
  _cachedConformance = null;
}

/**
 * Test-only hook: force a specific conformance result without
 * running the probe.
 */
export function _setWritingModeConformanceForTesting(
  value: boolean | null
): void {
  _cachedConformance = value;
}

/**
 * Sets a logical min-size pair (`min-block-size` / `min-inline-size`)
 * on an element, translating to physical (`min-height` / `min-width`)
 * when the engine doesn't honor logical sizing. The translation uses
 * `effectiveWritingMode` rather than reading the host's CSS, so it
 * stays consistent with the rest of the virtualizer's coordinate
 * logic on non-conforming engines.
 */
export function setLogicalMinSize(
  el: HTMLElement,
  block: string,
  inline: string,
  effectiveWritingMode: writingMode,
  conforming: boolean
): void {
  if (conforming) {
    el.style.minBlockSize = block;
    el.style.minInlineSize = inline;
    return;
  }
  // Clear any previously-applied logical sizes — on non-conforming
  // engines they have no layout effect, but they can still appear in
  // the inline style and confuse assertions/diagnostics.
  el.style.minBlockSize = '';
  el.style.minInlineSize = '';
  if (effectiveWritingMode === 'horizontal-tb') {
    el.style.minHeight = block;
    el.style.minWidth = inline;
  } else {
    // vertical-lr or vertical-rl: block axis is horizontal, inline is vertical.
    el.style.minWidth = block;
    el.style.minHeight = inline;
  }
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
