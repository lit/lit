/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ChildPositions,
  Layout,
  ScrollToCoordinates,
} from '../layouts/shared/Layout.js';
import {
  ScrollIntoViewEndedEvent,
  ScrollIntoViewEndedReason,
} from '../events.js';
import {ScrollElementIntoViewOptions} from './ScrollSource.js';
import type {ScrollerController} from '../ScrollerController.js';

/**
 * Base class for scroll-into-view intent state.
 *
 * "Intent" is a smooth-scrolling concept: it represents a single
 * in-flight smooth scroll-into-view request, from the moment it starts
 * until it ends (arrival, AbortSignal cancellation, or replacement by a
 * new request). Instant scroll-into-view is synchronous and does not
 * use this abstraction — it produces no in-flight state to track.
 *
 * The base class owns the parts of intent state that don't vary by
 * scroll-source mode:
 *
 *   - `options`           — the original request
 *   - `AbortSignal` plumbing — listener attached on construction and
 *                              detached when the intent ends
 *   - end-reason tracking and dispatch of `ScrollIntoViewEndedEvent` on
 *     the virtualizer's host element
 *   - idempotent `end()` so multiple causes (e.g. signal abort fires
 *     during onEnd cleanup) collapse to a single dispatched event
 *
 * Subclasses contribute mode-specific state (destination tracking,
 * retarget mechanism, ScrollerController reference, etc.) and override
 * the `onEnd()` hook to release whatever resources they hold.
 */
export abstract class ScrollIntoViewIntent {
  readonly options: ScrollElementIntoViewOptions;
  protected hostElement: HTMLElement;
  protected signal: AbortSignal | null;
  protected signalHandler: (() => void) | null = null;
  /**
   * The reason the intent will end with. Defaulted to `'arrived'` because
   * arrival is the natural-completion case; cancellation and replacement
   * are recorded explicitly via {@link cancel}/{@link replace} (or by
   * calling {@link end} directly with the right reason).
   */
  private _endReason: ScrollIntoViewEndedReason = 'arrived';
  private _ended = false;

  constructor(hostElement: HTMLElement, options: ScrollElementIntoViewOptions) {
    this.hostElement = hostElement;
    this.options = options;
    this.signal = options.signal ?? null;
    if (this.signal) {
      this.signalHandler = () => this.cancel();
      this.signal.addEventListener('abort', this.signalHandler);
    }
  }

  /** True once the intent has ended (regardless of reason). */
  get ended(): boolean {
    return this._ended;
  }

  /** Convenience: end the intent with `reason: 'cancelled'`. */
  cancel(): void {
    this.end('cancelled');
  }

  /** Convenience: end the intent with `reason: 'replaced'`. */
  replace(): void {
    this.end('replaced');
  }

  /** Convenience: end the intent with `reason: 'arrived'`. */
  arrive(): void {
    this.end('arrived');
  }

  /**
   * End the intent. Idempotent: a second call (e.g. from a signal abort
   * that fires while `onEnd` is running) is a no-op so that exactly one
   * `ScrollIntoViewEndedEvent` is dispatched per intent.
   */
  end(reason: ScrollIntoViewEndedReason): void {
    if (this._ended) return;
    this._ended = true;
    this._endReason = reason;
    if (this.signal && this.signalHandler) {
      this.signal.removeEventListener('abort', this.signalHandler);
    }
    this.signal = null;
    this.signalHandler = null;
    this.onEnd();
    this.hostElement.dispatchEvent(new ScrollIntoViewEndedEvent(reason));
  }

  /** The reason this intent ended with (only meaningful after `end`). */
  get endReason(): ScrollIntoViewEndedReason {
    return this._endReason;
  }

  /**
   * Mode-specific cleanup hook. Called once when the intent ends, after
   * the signal listener has been detached and before the
   * `scrollintoviewended` event is dispatched.
   */
  protected abstract onEnd(): void;
}

// ---------------------------------------------------------------------
// Managed-mode intents
// ---------------------------------------------------------------------

/**
 * Managed-mode intent for `behavior: 'smooth'`. Pin is NOT held; the
 * consumer drives the animation via progressive `viewport` pushes and
 * the layout's rendered range follows naturally.
 *
 * The source uses {@link recentViewports} for at-rest arrival inference
 * (when the consumer's pushes settle near {@link destination}, the
 * source calls {@link arrive}).
 */
export class ManagedSmoothIntent extends ScrollIntoViewIntent {
  destination: ScrollToCoordinates;
  /** Sliding window of recent viewport pushes used for at-rest detection. */
  readonly recentViewports: Array<{top: number; left: number}> = [];

  constructor(
    hostElement: HTMLElement,
    options: ScrollElementIntoViewOptions,
    initialDestination: ScrollToCoordinates
  ) {
    super(hostElement, options);
    this.destination = initialDestination;
  }

  protected onEnd(): void {
    // Nothing source-specific to clean up: no pin to release, no
    // controller to cancel.
  }
}

// ---------------------------------------------------------------------
// DOM-mode intents
// ---------------------------------------------------------------------

/**
 * DOM-mode intent for `behavior: 'smooth'`. Wraps a
 * {@link ScrollerController.managedScrollTo} call: the controller owns
 * the in-flight destination state and detects arrival from real scroll
 * events; this intent bridges those signals into the unified intent
 * lifecycle so {@link ScrollIntoViewEndedEvent} fires consistently.
 *
 * Also holds the externally-callable retargeting function returned by
 * `managedScrollTo` so the source can ask the intent to retarget the
 * in-flight scroll when the target item enters the rendered range.
 */
export class DomSmoothIntent extends ScrollIntoViewIntent {
  private _controller: ScrollerController;
  private _layout: Layout;
  private _updater: ((coords: ScrollToCoordinates) => void) | null;

  constructor(
    hostElement: HTMLElement,
    options: ScrollElementIntoViewOptions,
    controller: ScrollerController,
    layout: Layout,
    initialCoordinates: ScrollToCoordinates
  ) {
    super(hostElement, options);
    this._controller = controller;
    this._layout = layout;
    // Bridge ScrollerController's `_end` callback into the intent
    // lifecycle. `_end` fires from arrival detection or when a new
    // managed scroll replaces this one. We map both to `arrive()` here
    // because the only way to terminate from outside ScrollerController
    // is `cancelManagedScrollTo()`, which our `onEnd` hook calls only
    // after the intent has already been ended for some other reason
    // (cancelled / replaced) — at which point the `_ended` flag prevents
    // a second `arrive()` from dispatching anything.
    this._updater = controller.managedScrollTo(
      {...initialCoordinates, behavior: 'smooth'},
      () => layout.getScrollIntoViewCoordinates(options),
      () => this.arrive()
    );
  }

  /**
   * Called once per layout cycle from the source's
   * `checkScrollIntoViewTarget` hook. If the target item has come into
   * the rendered range, refresh the in-flight smooth-scroll destination
   * with the layout's freshly-computed position for that item.
   */
  retargetIfRendered(positions: ChildPositions | null): void {
    if (this._updater && positions?.has(this.options.index)) {
      this._updater(this._layout.getScrollIntoViewCoordinates(this.options));
    }
  }

  protected onEnd(): void {
    // If we ended for a reason other than natural arrival, the
    // ScrollerController still has the in-flight scroll registered.
    // Cancel it — but be careful: cancelManagedScrollTo invokes the
    // controller's `_end` callback, which would re-enter this intent
    // via `arrive()`. The base class's idempotent `_ended` guard
    // makes that a no-op, so the second dispatch is suppressed.
    if (this.endReason !== 'arrived') {
      this._controller.cancelManagedScrollTo();
    }
    this._updater = null;
  }
}
