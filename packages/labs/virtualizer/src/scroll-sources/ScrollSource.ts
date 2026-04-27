/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  Layout,
  LogicalCoordinates,
  ScrollToCoordinates,
  VirtualizerSize,
  writingMode,
  direction,
  ChildPositions,
} from '../layouts/shared/Layout.js';

/**
 * A `Viewport` describes the externally-managed viewport for a virtualizer
 * running in `scroller: 'managed'` mode. The external controller provides
 * scroll position and viewport dimensions in physical (top/left/width/height)
 * coordinates; the virtualizer performs no DOM observation for these values.
 */
export interface Viewport {
  scrollTop: number;
  scrollLeft: number;
  width: number;
  height: number;
}

/**
 * Options accepted by `ScrollSource.scrollElementIntoView()`. The shape
 * mirrors the `ScrollIntoViewOptions` Web platform interface plus the
 * target item index and an optional `AbortSignal` used to cancel an
 * in-flight intent.
 */
export interface ScrollElementIntoViewOptions extends ScrollIntoViewOptions {
  index: number;
  /**
   * Optional `AbortSignal` for terminating the scroll-into-view intent.
   * Aborting the signal releases the pin associated with the intent and
   * fires a `scrollintoviewended` event with `reason: 'cancelled'`.
   * Available in all scroll modes.
   */
  signal?: AbortSignal;
}

/**
 * The subset of Virtualizer state and callbacks that ScrollSource
 * implementations need access to. Passed to the source's constructor.
 *
 * This intentionally exposes only what sources actually need, keeping the
 * source implementations decoupled from the full Virtualizer interface.
 */
export interface ScrollSourceHost {
  /** The host element managed by the virtualizer. */
  readonly hostElement: HTMLElement;

  /**
   * The current managed viewport, or `null` when the virtualizer is not
   * in managed mode. Only `ManagedScrollSource` reads this; other sources
   * ignore it.
   */
  readonly viewport: Viewport | null;

  /**
   * The current virtualizer size as reported by the layout (or `null` if
   * the layout has not yet computed a size). Used by `ManagedScrollSource`
   * to derive `layout.scrollSize`.
   */
  readonly virtualizerSize: VirtualizerSize | null;

  /**
   * Called by the source to schedule a layout update. DOM-based sources
   * call this from resize listeners and from non-scroll triggers; the
   * managed source path uses Virtualizer's existing scheduling directly
   * via the `viewport` setter, so `ManagedScrollSource` does not call
   * this.
   */
  scheduleUpdate(): void;

  /**
   * Called by DOM-based sources when a user-initiated scroll event is
   * detected, so Virtualizer can run its freeze/unpin logic and schedule
   * a layout update. The managed source never calls this.
   *
   * The source provides the current physical scroll position and
   * viewport size along the scroll axis, plus a flag indicating whether
   * a programmatic correction is in progress. Virtualizer uses these
   * values to detect large scroll jumps without needing to know about
   * the source's internal scroller.
   */
  handleScrollEvent(
    scrollPosition: number,
    viewportSize: number,
    correctingError: boolean
  ): void;
}

/**
 * Strategy interface that owns scroll-position and viewport-size
 * acquisition, applies scroll-error corrections, and implements
 * scroll-into-view for a virtualizer.
 *
 * The Virtualizer creates one `ScrollSource` at construction time based on
 * the `scroller` config and delegates all scroll/viewport concerns to it.
 * The interface intentionally does NOT cover layout, rendering, child
 * measurement, or host element sizing — those remain in Virtualizer
 * because they are mode-agnostic.
 */
export interface ScrollSource {
  /**
   * `true` when the host element itself is the scroll container. Affects
   * CSS decisions in Virtualizer (`_applyVirtualizerStyles`,
   * `_sizeHostElement`).
   */
  readonly isSelfScroller: boolean;

  /**
   * `true` while a programmatic scroll-error correction is in progress.
   * Virtualizer reads this in `_handleScrollEvent()` to suppress freeze
   * and unpin logic during corrections.
   *
   * Always `false` for `ManagedScrollSource` (no scroll events).
   */
  readonly correctingScrollError: boolean;

  /**
   * Called from `Virtualizer.connected()`. Set up any DOM listeners,
   * `ResizeObserver`s, or other resources needed to track scroll position
   * and viewport size.
   */
  connect(): void;

  /**
   * Called from `Virtualizer.disconnected()`. Tear down everything created
   * in `connect()`.
   */
  disconnect(): void;

  /**
   * Called from `Virtualizer._updateView()` each frame. Populates the
   * following properties on the layout:
   *
   *   layout.viewportScroll       — LogicalCoordinates {block, inline}
   *   layout.viewportSize         — LogicalSize {blockSize, inlineSize}
   *   layout.offsetWithinScroller — LogicalCoordinates {block, inline}
   *   layout.scrollSize           — LogicalSize {blockSize, inlineSize}
   *
   * Implementations are responsible for converting from whatever physical
   * coordinate system they use (DOM, stored Viewport, etc.) into the
   * logical coordinates expected by the layout, taking writing-mode and
   * direction into account.
   *
   * Virtualizer reads writing-mode and direction from the host element's
   * computed style before calling this method and passes them in. Each
   * source is responsible for handling its own scroller writing mode
   * (which may differ from the host's in ancestor mode).
   */
  updateView(
    layout: Layout,
    writingMode: writingMode,
    direction: direction
  ): void;

  /**
   * Apply a scroll-error correction reported by the layout. The correction
   * is in logical coordinates. Implementations are responsible for any
   * physical-coordinate conversion needed to apply it.
   */
  correctScrollError(error: LogicalCoordinates): void;

  /**
   * Scroll a (possibly virtual) element into view. Implementations may
   * support smooth scrolling (DOM-based sources) or fall back to pin-based
   * instant scrolling (managed mode).
   *
   * In DOM modes the Virtualizer may bypass this call when the target
   * element is already in the rendered range and use native
   * `scrollIntoView` on the rendered child directly; this method is
   * still expected to compute and return the destination coordinates so
   * the caller can use them. In managed mode the Virtualizer always
   * routes through this method.
   *
   * Returns the computed destination in the consumer-facing coordinate
   * system (physical `top`/`left`, with only the axes the layout
   * touches present — typically the block axis only).
   */
  scrollElementIntoView(
    options: ScrollElementIntoViewOptions,
    layout: Layout
  ): ScrollToCoordinates;

  /**
   * Called by Virtualizer at the end of each layout cycle. If the source
   * has an in-progress smooth scroll whose target item has now come into
   * the rendered range, the source can use this opportunity to retarget
   * the in-flight scroll using the layout's freshly-computed position
   * for the item.
   *
   * Implementations that don't support smooth scrolling (e.g.
   * `ManagedScrollSource`) should implement this as a no-op.
   */
  checkScrollIntoViewTarget(
    positions: ChildPositions | null,
    layout: Layout
  ): void;
}
