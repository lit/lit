/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ChildPositions,
  Layout,
  LogicalCoordinates,
  ScrollToCoordinates,
  VirtualizerSizeValue,
  writingMode,
  direction,
} from '../layouts/shared/Layout.js';
import {
  ScrollSource,
  ScrollSourceHost,
  ScrollElementIntoViewOptions,
  Viewport,
} from './ScrollSource.js';
import {DestinationChangedEvent, ScrollErrorEvent} from '../events.js';
import {
  ManagedSmoothIntent,
  ScrollIntoViewIntent,
} from './ScrollIntoViewIntent.js';

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
 * Sub-pixel tolerance used both for the `destinationchanged` firing
 * threshold and for at-rest arrival detection. Shifts and viewport
 * deltas smaller than this are treated as no-change.
 */
const EPSILON = 0.5;

/**
 * Number of consecutive viewport pushes (including the latest) required
 * to be within EPSILON of one another for the consumer's motion to be
 * considered "at rest" for purposes of arrival inference. Two is the
 * minimum that distinguishes "stopped" from "passing through."
 */
const AT_REST_WINDOW = 2;

/**
 * Convert a `ScrollToCoordinates` (which may have a single axis set)
 * into the always-fully-populated physical pair used by the public
 * `DestinationChangedEvent`. Missing axes default to 0; consumers
 * compare against the axis the layout actually drives.
 */
function toPhysicalCoordinates(c: ScrollToCoordinates): {
  top: number;
  left: number;
} {
  return {top: c.top ?? 0, left: c.left ?? 0};
}

/**
 * `ScrollSource` implementation for `scroller: 'managed'` mode.
 *
 * In managed mode the virtualizer performs no DOM observation for scroll
 * position or viewport size. Instead, an external controller provides
 * those values via the `Virtualizer.viewport` property and is responsible
 * for updating them whenever scroll or resize occurs in its own system.
 *
 * Scroll-into-view splits by `behavior`:
 *
 *   - `behavior: 'smooth'` — no pin is set. The consumer drives an
 *     animation; the layout's rendered range follows their progressive
 *     `viewport` pushes naturally. Destination refinements (as items
 *     get measured) are reported via `destinationchanged`. Arrival is
 *     inferred from at-rest detection on the consumer's pushed viewport.
 *
 *   - `behavior: 'instant'` (default) — `layout.pin = options` is set,
 *     a synchronous reflow is forced, and the post-reflow destination is
 *     returned. This mirrors DOM-mode instant scroll: the layout's
 *     `_setPositionFromPin` → `_scrollError` chain produces a
 *     `ScrollErrorEvent` that the consumer applies to its visible state
 *     to teleport. The pin is held for the duration of the intent so
 *     subsequent estimation refinements continue to drive the layout
 *     toward the true destination; on intent end (via `AbortSignal`,
 *     replacement, or external cancel) the pin is released.
 *
 * Either way:
 *
 *   - `scrollerror` fires when the source needs to communicate a
 *     correction to the consumer. The source self-corrects its internal
 *     view of the consumer's viewport at dispatch time so the consumer
 *     is not required to push viewport back.
 *
 *   - `destinationchanged` fires (during an active intent) whenever the
 *     layout's estimate of the destination shifts beyond ε.
 *
 *   - `scrollintoviewended` fires when an intent ends from any cause:
 *     `arrived` (smooth: at-rest detection; instant: caller-initiated
 *     end-of-intent isn't auto-inferred), `cancelled` (signal abort), or
 *     `replaced` (a new `scrollIntoView` superseded this one).
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

  // Internal "expected" view of the consumer's viewport. Updated when
  // `correctScrollError` is dispatched (anticipating that the consumer
  // applies the delta synchronously) so that subsequent `updateView`
  // calls between dispatch and the consumer's next push don't re-read a
  // stale `host.viewport` and trigger phantom re-corrections. Reset to
  // `host.viewport` whenever the consumer pushes a new viewport object.
  private _internalViewport: Viewport | null = null;
  private _lastSeenHostViewport: Viewport | null = null;

  /**
   * The currently active smooth-scroll intent, or null. Instant scroll
   * is fully synchronous (see {@link scrollElementIntoView}) and
   * doesn't register an intent.
   */
  private _intent: ManagedSmoothIntent | null = null;

  /**
   * One-shot flag set immediately before the synchronous reflow inside
   * an instant {@link scrollElementIntoView} call. It tells
   * {@link correctScrollError} to update the source's internal viewport
   * tracking but skip dispatching the `ScrollErrorEvent` to the
   * consumer — the consumer already has the destination in hand from
   * the `scrollIntoView` return value, so an event would be redundant
   * (and risks a double-teleport if the consumer applies both).
   *
   * Reset to `false` inside `correctScrollError` after the suppressed
   * dispatch.
   */
  private _suppressNextScrollErrorDispatch = false;

  constructor(host: ScrollSourceHost) {
    this._host = host;
  }

  connect(): void {
    // No DOM observation in managed mode.
  }

  disconnect(): void {
    if (this._intent !== null) {
      this._intent.cancel();
      this._intent = null;
    }
    this._internalViewport = null;
    this._lastSeenHostViewport = null;
  }

  updateView(
    layout: Layout,
    writingMode: writingMode,
    direction: direction
  ): void {
    const hostViewport = this._host.viewport;
    if (!hostViewport) {
      // Managed mode is selected but no viewport has been provided yet.
      // Leave the layout's previous values untouched; once the external
      // controller sets viewport, a new updateView will follow.
      return;
    }

    // If the consumer has pushed a new viewport object since we last
    // saw one, that push is authoritative — adopt it as our internal
    // view. Otherwise continue using the internally-tracked viewport,
    // which may include corrections we've dispatched but the consumer
    // hasn't yet had a chance to push back.
    const consumerPushed = hostViewport !== this._lastSeenHostViewport;
    if (consumerPushed) {
      this._lastSeenHostViewport = hostViewport;
      this._internalViewport = hostViewport;
    }

    const viewport = this._internalViewport!;
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

    // At-rest detection samples *consumer-pushed* viewports only —
    // internal `updateView` invocations triggered by other state
    // changes (e.g. items setter, scheduled reflows from a pin set or
    // released elsewhere) don't represent fresh consumer motion and
    // would otherwise produce phantom "consecutive equal samples"
    // that falsely trigger arrival.
    if (consumerPushed && this._intent !== null) {
      this._checkAtRest(this._intent, viewport);
    }
  }

  correctScrollError(error: LogicalCoordinates): void {
    // Convert the logical correction to physical (top/left) using the
    // host's writing mode. This is the only DOM read in this source,
    // and only happens when a correction occurs (rare).
    const wm =
      (getComputedStyle(this._host.hostElement).writingMode as writingMode) ||
      'horizontal-tb';

    let top: number;
    let left: number;
    if (wm === 'horizontal-tb' || wm === 'unknown') {
      top = error.block;
      left = error.inline;
    } else {
      top = error.inline;
      left = error.block;
    }

    // Self-correct our internal view of the consumer's viewport,
    // anticipating the consumer applies the delta synchronously inside
    // the listener (or that, in the suppressed-dispatch case, the
    // consumer teleports directly using the value returned from
    // `scrollIntoView`). Either way, the consumer ends up at the
    // corrected position, so updating `_internalViewport` keeps
    // subsequent layout cycles consistent without depending on the
    // consumer pushing a corrected viewport back.
    if (this._internalViewport) {
      this._internalViewport = {
        ...this._internalViewport,
        scrollTop: this._internalViewport.scrollTop - top,
        scrollLeft: this._internalViewport.scrollLeft - left,
      };
    }

    if (this._suppressNextScrollErrorDispatch) {
      this._suppressNextScrollErrorDispatch = false;
      return;
    }

    this._host.hostElement.dispatchEvent(new ScrollErrorEvent({top, left}));
  }

  scrollElementIntoView(
    options: ScrollElementIntoViewOptions,
    layout: Layout
  ): ScrollToCoordinates {
    // If the AbortSignal is already aborted, treat the call as a
    // no-op: still compute and return the destination, but don't take
    // any side effects (no pin, no intent, no events).
    if (options.signal?.aborted) {
      return layout.getScrollIntoViewCoordinates(options);
    }

    const isInstant = options.behavior !== 'smooth';

    if (isInstant) {
      // INSTANT: synchronous teleport, no intent state. Mirrors DOM-mode
      // instant scroll's mechanism (pin + `_setPositionFromPin` →
      // `_scrollError`), but here the source consumes the dispatched
      // correction itself rather than forwarding it to the consumer:
      //
      //   1. Set pin → layout's `_setPositionFromPin` will move
      //      `_blockScrollPosition` to the destination on the next reflow.
      //   2. Force a synchronous reflow so the move happens *now*.
      //   3. The reflow's correction reaches `correctScrollError`; we
      //      use the `_suppressNextScrollErrorDispatch` flag so the
      //      source updates its internal viewport tracking to the
      //      destination but does NOT dispatch `ScrollErrorEvent`. The
      //      consumer already has the destination via the function
      //      return value; an event would be redundant and risks a
      //      double-teleport if applied alongside the return value.
      //   4. Release the pin so subsequent reflows follow the
      //      consumer's pushed viewport (or our self-corrected internal
      //      tracking, which now reads "destination").
      //
      // Any prior smooth intent gets replaced — the consumer issued a
      // new request, the old in-flight one is superseded.
      if (this._intent !== null) {
        const prior = this._intent;
        this._intent = null;
        prior.replace();
      }

      // Compute the destination before the pin-driven reflow so the
      // value we return is what the consumer expects to see for this
      // call. Subsequent estimation refinements aren't tracked (no
      // intent), matching the "instant is one-shot" mental model.
      const destination = layout.getScrollIntoViewCoordinates(options);

      layout.pin = options;
      this._suppressNextScrollErrorDispatch = true;
      layout.reflowIfNeeded(true);
      // Release the pin. This schedules another microtask reflow, but
      // by then `_blockScrollPosition` and our internal viewport are
      // both at the destination, so the post-pin reflow is a no-op.
      layout.pin = null;
      return destination;
    }

    // SMOOTH: register an intent so destination refinements,
    // AbortSignal abort, and at-rest arrival inference all have a
    // place to live. Pin is NOT held — the consumer drives the
    // animation; the layout's rendered range follows their progressive
    // viewport pushes naturally.
    if (this._intent !== null) {
      const prior = this._intent;
      this._intent = null;
      prior.replace();
    }
    const destination = layout.getScrollIntoViewCoordinates(options);
    this._intent = new ManagedSmoothIntent(
      this._host.hostElement,
      options,
      destination
    );
    return destination;
  }

  checkScrollIntoViewTarget(
    _positions: ChildPositions | null,
    layout: Layout
  ): void {
    if (this._intent === null) {
      return;
    }

    // Re-query the destination from the layout's just-completed
    // reflow. If it shifted beyond ε, fire `destinationchanged` so
    // the consumer can retarget any in-flight animation. (For instant
    // intents the layout's pin pulls `_blockScrollPosition` along with
    // each refinement, so the consumer also gets a `scrollerror` to
    // apply — `destinationchanged` is the parallel signal that names
    // the new target value directly.)
    const newDestination = layout.getScrollIntoViewCoordinates(
      this._intent.options
    );
    if (this._destinationsDiffer(this._intent.destination, newDestination)) {
      this._intent.destination = newDestination;
      this._host.hostElement.dispatchEvent(
        new DestinationChangedEvent(toPhysicalCoordinates(newDestination))
      );
    }
  }

  // ---- Internals --------------------------------------------------------

  private _destinationsDiffer(
    a: ScrollToCoordinates,
    b: ScrollToCoordinates
  ): boolean {
    return (
      Math.abs((a.top ?? 0) - (b.top ?? 0)) >= EPSILON ||
      Math.abs((a.left ?? 0) - (b.left ?? 0)) >= EPSILON
    );
  }

  private _checkAtRest(intent: ManagedSmoothIntent, viewport: Viewport): void {
    intent.recentViewports.push({
      top: viewport.scrollTop,
      left: viewport.scrollLeft,
    });
    if (intent.recentViewports.length > AT_REST_WINDOW) {
      intent.recentViewports.shift();
    }
    if (intent.recentViewports.length < AT_REST_WINDOW) {
      return;
    }

    // Stability: every recent push within EPSILON of every other.
    const recent = intent.recentViewports;
    const ref = recent[0];
    for (let i = 1; i < recent.length; i++) {
      if (
        Math.abs(recent[i].top - ref.top) >= EPSILON ||
        Math.abs(recent[i].left - ref.left) >= EPSILON
      ) {
        return; // Still moving.
      }
    }

    // Proximity to destination on the axis the layout actually drives.
    // For typical block-axis layouts only one of {top, left} is set on
    // the destination; the other axis isn't part of the scroll intent
    // so we don't require it to match.
    const dest = intent.destination;
    const latest = recent[recent.length - 1];
    const blockAtRest =
      dest.top !== undefined ? Math.abs(latest.top - dest.top) < EPSILON : true;
    const inlineAtRest =
      dest.left !== undefined
        ? Math.abs(latest.left - dest.left) < EPSILON
        : true;

    if (blockAtRest && inlineAtRest) {
      this._intent = null;
      intent.arrive();
    }
  }
}

// Re-export the intent base so external callers (tests, demos) that
// want to type-check against the abstraction can.
export type {ScrollIntoViewIntent};
