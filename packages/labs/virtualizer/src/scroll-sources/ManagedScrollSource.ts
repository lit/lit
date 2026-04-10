/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  Layout,
  LogicalCoordinates,
  VirtualizerSizeValue,
  writingMode,
  direction,
} from '../layouts/shared/Layout.js';
import {
  ScrollSource,
  ScrollSourceHost,
  ScrollElementIntoViewOptions,
} from './ScrollSource.js';

/**
 * Resolve a `VirtualizerSizeValue` (which may be a number or a
 * `[minOrMax, number]` tuple) to a plain pixel value. The tuple form is
 * used by the Virtualizer for the cross axis in non-scroller mode; for
 * `scrollSize` we just need the numeric magnitude.
 */
function resolveSize(value: VirtualizerSizeValue): number {
  return typeof value === 'number' ? value : value[1];
}

/**
 * `ScrollSource` implementation for `scroller: 'managed'` mode.
 *
 * In managed mode the virtualizer performs no DOM observation for scroll
 * position or viewport size. Instead, an external controller provides
 * those values via the `Virtualizer.viewport` property and is responsible
 * for updating them whenever scroll or resize occurs in its own system.
 *
 * This source:
 *   - registers no scroll listeners and no resize observers
 *   - reads scroll/viewport from `host.viewport` on each `updateView()`
 *   - dispatches a `scrollerror` `CustomEvent` on the host element when
 *     the layout reports a scroll-error correction (the external
 *     controller listens and adjusts its own scroll state)
 *   - supports only the pin-based instant path for `scrollIntoView`
 *
 * ## Coordinate convention
 *
 * Unlike the browser's native `Element.scrollTop`/`scrollLeft` (which
 * have quirky semantics in vertical and RTL writing modes), the values in
 * `Viewport` are always **non-negative** and represent offsets along the
 * host element's physical axes, measured from the inline-start /
 * block-start corner of the scrollable content. This gives external
 * controllers a clean, writing-mode-agnostic mental model.
 *
 * For the default `horizontal-tb` writing mode this is identical to
 * native browser semantics: `scrollTop` is the vertical offset from the
 * top, `scrollLeft` is the horizontal offset from the left. For vertical
 * writing modes the meanings of `scrollTop` and `scrollLeft` swap roles
 * (since the block axis becomes horizontal), but in all cases they
 * remain positive offsets from the relevant content edge.
 */
export class ManagedScrollSource implements ScrollSource {
  readonly isSelfScroller = false;
  readonly correctingScrollError = false;

  private _host: ScrollSourceHost;

  constructor(host: ScrollSourceHost) {
    this._host = host;
  }

  connect(): void {
    // No DOM observation in managed mode.
  }

  disconnect(): void {
    // Nothing to tear down.
  }

  updateView(
    layout: Layout,
    writingMode: writingMode,
    direction: direction
  ): void {
    const viewport = this._host.viewport;
    if (!viewport) {
      // Managed mode is selected but no viewport has been provided yet.
      // Leave the layout's previous values untouched; once the external
      // controller sets viewport, a new updateView will follow.
      return;
    }

    const {scrollTop, scrollLeft, width, height} = viewport;

    // Map physical (top/left/width/height) to logical (block/inline)
    // based on the host's writing mode. The convention used by Viewport
    // is that scrollTop/scrollLeft are always non-negative offsets along
    // the host's physical axes, so direction (ltr/rtl) does not affect
    // the mapping — the external controller is responsible for measuring
    // along the inline-start direction regardless of direction.
    let blockOffset: number;
    let inlineOffset: number;
    let blockSize: number;
    let inlineSize: number;
    if (writingMode === 'horizontal-tb' || writingMode === 'unknown') {
      blockOffset = scrollTop;
      inlineOffset = scrollLeft;
      blockSize = height;
      inlineSize = width;
    } else {
      // vertical-lr or vertical-rl: block axis is horizontal,
      // inline axis is vertical.
      blockOffset = scrollLeft;
      inlineOffset = scrollTop;
      blockSize = width;
      inlineSize = height;
    }

    layout.viewportScroll = {block: blockOffset, inline: inlineOffset};
    layout.viewportSize = {blockSize, inlineSize};
    layout.offsetWithinScroller = {block: 0, inline: 0};

    // Derive scrollSize from the layout's reported virtualizer size.
    // BaseLayout._clampScrollPosition uses scrollSize to bound scroll-into-
    // view targets; in managed mode the external controller owns scroll
    // bounds, but providing a sensible value here means scroll-into-view
    // "just works" without the controller needing to reimplement clamping.
    //
    // On the very first frame virtualizerSize is null; the layout already
    // handles this case (it doesn't compute scroll-into-view positions
    // until a real size is known), so we just leave scrollSize at its
    // current value (zero by default).
    const vSize = this._host.virtualizerSize;
    if (vSize !== null) {
      layout.scrollSize = {
        blockSize: resolveSize(vSize.blockSize),
        inlineSize: resolveSize(vSize.inlineSize),
      };
    }

    layout.writingMode = writingMode;
    layout.direction = direction;
  }

  correctScrollError(error: LogicalCoordinates): void {
    // Convert the logical correction to physical (top/left) using the
    // host's writing mode, then dispatch as a CustomEvent. The external
    // controller is responsible for adjusting its own scroll state and
    // updating Virtualizer.viewport accordingly.
    //
    // KNOWN LIMITATION (PoC): There is a potential one-frame visual gap
    // between the corrected DOM positioning and the corrected scroll
    // position, because the viewport setter schedules layout async. In
    // normal modes this is masked by ScrollerController applying the
    // native scroll synchronously alongside the DOM update. Layout
    // corrections are infrequent so this is acceptable initially.
    //
    // FUTURE OPTION: If the one-frame gap proves problematic in practice,
    // we could add an optional `onScrollError` callback to the Viewport
    // interface that returns a new Viewport synchronously, allowing the
    // source to apply the correction in the same frame as the DOM update.

    const wm = this._host.viewport
      ? // We don't have writing mode here directly; read from the host
        // element's computed style. This is the only DOM read in this
        // source, and only happens when a correction occurs (rare).
        (getComputedStyle(this._host.hostElement).writingMode as writingMode)
      : 'horizontal-tb';

    let top: number;
    let left: number;
    if (wm === 'horizontal-tb' || wm === 'unknown') {
      top = error.block;
      left = error.inline;
    } else {
      top = error.inline;
      left = error.block;
    }

    this._host.hostElement.dispatchEvent(
      new CustomEvent('scrollerror', {
        detail: {top, left},
      })
    );
  }

  scrollElementIntoView(
    options: ScrollElementIntoViewOptions,
    layout: Layout
  ): void {
    // Smooth scrolling is not supported in managed mode. Fall back to
    // pin-based instant scrolling, which the layout handles internally.
    layout.pin = options;
  }
}
