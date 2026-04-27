/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export class RangeChangedEvent extends Event {
  static eventName = 'rangeChanged';

  first: number;
  last: number;

  constructor(range: Range) {
    super(RangeChangedEvent.eventName, {bubbles: false});
    this.first = range.first;
    this.last = range.last;
  }
}

export class VisibilityChangedEvent extends Event {
  static eventName = 'visibilityChanged';

  first: number;
  last: number;

  constructor(range: Range) {
    super(VisibilityChangedEvent.eventName, {bubbles: false});
    this.first = range.first;
    this.last = range.last;
  }
}

export class UnpinnedEvent extends Event {
  static eventName = 'unpinned';

  constructor() {
    super(UnpinnedEvent.eventName, {bubbles: false});
  }
}

interface Range {
  first: number;
  last: number;
}

/**
 * Physical (top/left) coordinates used by managed-mode scroll-error and
 * destination signals. Values are in the same convention as the
 * `Viewport.scrollTop`/`scrollLeft` the external controller pushes:
 * non-negative offsets along the host element's physical axes.
 */
export interface PhysicalCoordinates {
  top: number;
  left: number;
}

/**
 * Fired in `scroller: 'managed'` mode when the layout reports a
 * scroll-error correction. The external controller is expected to apply
 * `delta` to its visible state synchronously inside the listener (e.g.
 * by updating its CSS translate). The virtualizer self-corrects its
 * internal view of the consumer's viewport at dispatch time, so the
 * consumer does NOT need to push a corrected viewport in response.
 */
export class ScrollErrorEvent extends Event {
  static eventName = 'scrollerror';

  delta: PhysicalCoordinates;

  constructor(delta: PhysicalCoordinates) {
    super(ScrollErrorEvent.eventName, {bubbles: false});
    this.delta = delta;
  }
}

/**
 * Fired in `scroller: 'managed'` mode while a `scrollIntoView` intent is
 * active and the layout produces a refined estimate of the destination
 * (e.g. as items between the current viewport and the target are measured
 * and their true sizes are folded into the position calculation). The
 * external controller is expected to retarget any in-flight animation
 * toward `destination`.
 */
export class DestinationChangedEvent extends Event {
  static eventName = 'destinationchanged';

  destination: PhysicalCoordinates;

  constructor(destination: PhysicalCoordinates) {
    super(DestinationChangedEvent.eventName, {bubbles: false});
    this.destination = destination;
  }
}

/**
 * Reason a `scrollIntoView` intent ended.
 *
 * - `'arrived'`  — the consumer's viewport reached the destination
 *                  (managed mode: detected via at-rest inference; DOM
 *                  modes: detected by `ScrollerController` from a scroll
 *                  event within tolerance).
 * - `'cancelled'` — the consumer aborted the `AbortSignal` passed to
 *                   `scrollIntoView`.
 * - `'replaced'` — a new `scrollIntoView` call superseded this intent.
 */
export type ScrollIntoViewEndedReason = 'arrived' | 'cancelled' | 'replaced';

/**
 * Fired (in any scroll mode) when a `scrollIntoView` intent ends.
 */
export class ScrollIntoViewEndedEvent extends Event {
  static eventName = 'scrollintoviewended';

  reason: ScrollIntoViewEndedReason;

  constructor(reason: ScrollIntoViewEndedReason) {
    super(ScrollIntoViewEndedEvent.eventName, {bubbles: false});
    this.reason = reason;
  }
}
