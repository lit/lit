/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  Layout,
  LogicalCoordinates,
  ChildPositions,
  ScrollToCoordinates,
  writingMode,
  direction,
} from '../layouts/shared/Layout.js';
import {fixedSizeDimensionCapitalized, fixedInsetLabel} from './_types.js';
import {ScrollerController} from '../ScrollerController.js';
import {
  ScrollSource,
  ScrollSourceHost,
  ScrollElementIntoViewOptions,
} from './ScrollSource.js';
import {_ResizeObserver, getClippingAncestors} from './_dom-utils.js';
import {DomSmoothIntent} from './ScrollIntoViewIntent.js';

/**
 * Abstract base class for the DOM-based scroll sources
 * (`AncestorScrollSource`, `SelfScrollSource`). Encapsulates everything
 * the two modes share: clipping-ancestor detection, `ScrollerController`
 * lifecycle, scroll/resize listener wiring, the writing-mode-aware
 * coordinate math in `updateView()`, error correction, and
 * smooth-scroll orchestration.
 *
 * Subclasses customize three things via protected hook methods:
 *   - {@link _includeSelfInClippingAncestors} — `false` for ancestor
 *     mode (the host is not the scroll container), `true` for self.
 *   - {@link _computeOffsetWithinScroller} — ancestor mode computes
 *     this from the host's position relative to the scroller; self
 *     mode returns `{block: 0, inline: 0}`.
 *   - {@link _emitWarnings} — self mode warns when the host has zero
 *     width or height (because a self-scroller needs explicit sizing);
 *     ancestor mode does nothing.
 */
export abstract class BaseDomScrollSource implements ScrollSource {
  abstract readonly isSelfScroller: boolean;

  get correctingScrollError(): boolean {
    return this._scrollerController?.correctingScrollError ?? false;
  }

  protected _host: ScrollSourceHost;
  protected _clippingAncestors: HTMLElement[] = [];
  protected _scrollerController: ScrollerController | null = null;
  protected _hostElementRO: ResizeObserver | null = null;
  protected _windowResizeCallback: (() => void) | null = null;
  protected _scrollEventListeners: (Element | Window)[] = [];
  protected _scrollEventListenerOptions: AddEventListenerOptions = {
    passive: true,
  };
  // Cached during the most recent updateView() so correctScrollError()
  // can perform writing-mode-aware coordinate conversion without
  // re-reading computed styles.
  protected _scrollerWritingMode: writingMode = 'unknown';
  // EventListenerObject implementation: scroll/resize events are
  // dispatched here. Defined as an arrow-bound member below.
  protected _eventHandler: EventListenerObject;

  /**
   * The currently active smooth-scroll intent, or null. Instant scroll
   * is fully synchronous (just sets the layout pin; the existing pin →
   * `_scrollError` → native `scrollTo` chain handles the teleport) and
   * doesn't register an intent.
   *
   * Lifecycle (signal binding, end-reason tracking, dispatch of
   * `scrollintoviewended`) is owned by the intent base class; this
   * source holds the reference and uses it for retargeting and
   * replacement.
   */
  private _intent: DomSmoothIntent | null = null;

  constructor(host: ScrollSourceHost) {
    this._host = host;
    this._eventHandler = {
      handleEvent: (event: Event) => this._onScrollOrResize(event),
    };
  }

  // ---- Hook methods (subclass customization points) ---------------------

  /**
   * Whether the host element itself should be included as a clipping
   * ancestor when detecting the scroll container chain.
   */
  protected abstract _includeSelfInClippingAncestors(): boolean;

  /**
   * Compute the layout's `offsetWithinScroller`. Self mode returns
   * `{block: 0, inline: 0}`. Ancestor mode computes the offset from
   * the host element's position relative to the scrolling element.
   */
  protected abstract _computeOffsetWithinScroller(args: {
    hostElementBounds: DOMRect;
    scrollingElement: Element;
    scrollingElementBounds: DOMRect;
    blockStartLabel: fixedInsetLabel;
    inlineStartLabel: fixedInsetLabel;
    blockScrollPosition: (el: Element) => number;
    inlineScrollPosition: (el: Element) => number;
  }): {block: number; inline: number};

  /**
   * Emit any source-specific warnings for the current frame. Self mode
   * uses this to warn when the host element has a zero size on either
   * axis (since self-scroller mode requires explicit CSS sizing).
   * Default: no-op.
   */
  protected _emitWarnings(_args: {
    hostElementBounds: DOMRect;
    isHidden: boolean;
  }): void {}

  // ---- ScrollSource implementation --------------------------------------

  connect(): void {
    const hostElement = this._host.hostElement;

    this._clippingAncestors = getClippingAncestors(
      hostElement,
      this._includeSelfInClippingAncestors()
    );
    this._scrollerController = new ScrollerController(
      this,
      this._clippingAncestors[0]
    );

    this._hostElementRO = new _ResizeObserver!(() =>
      this._host.scheduleUpdate()
    );
    this._windowResizeCallback = () => this._host.scheduleUpdate();

    this._hostElementRO.observe(hostElement);

    // Window scroll listener.
    this._scrollEventListeners.push(window);
    window.addEventListener(
      'scroll',
      this._eventHandler,
      this._scrollEventListenerOptions
    );

    // Scroll listeners on clipping ancestors plus RO observation.
    this._clippingAncestors.forEach((ancestor) => {
      ancestor.addEventListener(
        'scroll',
        this._eventHandler,
        this._scrollEventListenerOptions
      );
      this._scrollEventListeners.push(ancestor);
      this._hostElementRO!.observe(ancestor);
    });

    this._hostElementRO.observe(this._scrollerController.element);
    window.addEventListener('resize', this._windowResizeCallback);
  }

  disconnect(): void {
    this._scrollEventListeners.forEach((target) =>
      target.removeEventListener(
        'scroll',
        this._eventHandler,
        this._scrollEventListenerOptions
      )
    );
    this._scrollEventListeners = [];
    this._clippingAncestors = [];
    this._scrollerController?.detach(this);
    this._scrollerController = null;
    this._hostElementRO?.disconnect();
    this._hostElementRO = null;
    if (this._windowResizeCallback) {
      window.removeEventListener('resize', this._windowResizeCallback);
      this._windowResizeCallback = null;
    }
    if (this._intent !== null) {
      this._intent.cancel();
      this._intent = null;
    }
  }

  private _onScrollOrResize(event: Event) {
    if (event.type !== 'scroll') {
      this._host.scheduleUpdate();
      return;
    }
    if (
      event.currentTarget === window ||
      this._clippingAncestors.includes(event.currentTarget as HTMLElement)
    ) {
      const sc = this._scrollerController!;
      this._host.handleScrollEvent(
        sc.scrollTop,
        sc.element.getBoundingClientRect().height,
        sc.correctingScrollError
      );
    }
  }

  updateView(
    layout: Layout,
    writingMode: writingMode,
    direction: direction
  ): void {
    const hostElement = this._host.hostElement;
    const scrollerController = this._scrollerController;
    if (!hostElement || !hostElement.isConnected || !scrollerController) {
      return;
    }
    const scrollingElement = scrollerController.element;

    const scrollerStyle = getComputedStyle(scrollingElement);
    // Cache for use by correctScrollError().
    const scrollerWritingMode = (this._scrollerWritingMode =
      scrollerStyle.writingMode as writingMode);

    let insetBlockStart: number,
      insetBlockEnd: number,
      insetInlineStart: number,
      insetInlineEnd: number,
      blockSizeLabel: fixedSizeDimensionCapitalized,
      inlineSizeLabel: fixedSizeDimensionCapitalized,
      blockStartLabel: fixedInsetLabel,
      blockEndLabel: fixedInsetLabel,
      inlineStartLabel: fixedInsetLabel,
      inlineEndLabel: fixedInsetLabel,
      blockScrollPosition: (el: Element) => number,
      inlineScrollPosition: (el: Element) => number,
      reverseBlockCoordinates = false,
      reverseInlineCoordinates = false;

    // Whether scrollLeft is inverted (0 at right, negative toward left)
    // depends on the SCROLLER's writing-mode, not the host's.
    const scrollerHasInvertedScrollLeft = scrollerWritingMode === 'vertical-rl';

    if (writingMode === 'horizontal-tb') {
      blockSizeLabel = 'Height';
      inlineSizeLabel = 'Width';
      blockStartLabel = 'top';
      blockEndLabel = 'bottom';
      blockScrollPosition = (el: Element) => el.scrollTop;
      if (direction === 'ltr') {
        inlineStartLabel = 'left';
        inlineEndLabel = 'right';
        inlineScrollPosition = scrollerHasInvertedScrollLeft
          ? (el: Element) => -el.scrollLeft
          : (el: Element) => el.scrollLeft;
      } else {
        inlineStartLabel = 'right';
        inlineEndLabel = 'left';
        inlineScrollPosition = scrollerHasInvertedScrollLeft
          ? (el: Element) => el.scrollLeft
          : (el: Element) => -el.scrollLeft;
        reverseInlineCoordinates = true;
      }
    } else {
      blockSizeLabel = 'Width';
      inlineSizeLabel = 'Height';
      if (writingMode === 'vertical-lr') {
        blockStartLabel = 'left';
        blockEndLabel = 'right';
        blockScrollPosition = scrollerHasInvertedScrollLeft
          ? (el: Element) => -el.scrollLeft
          : (el: Element) => el.scrollLeft;
      } else {
        blockStartLabel = 'right';
        blockEndLabel = 'left';
        blockScrollPosition = scrollerHasInvertedScrollLeft
          ? (el: Element) => -el.scrollLeft
          : (el: Element) => el.scrollLeft;
        reverseBlockCoordinates = true;
      }
      if (direction === 'ltr') {
        inlineStartLabel = 'top';
        inlineEndLabel = 'bottom';
        inlineScrollPosition = (el: Element) => el.scrollTop;
      } else {
        inlineStartLabel = 'bottom';
        inlineEndLabel = 'top';
        inlineScrollPosition = (el: Element) => -el.scrollTop;
        reverseInlineCoordinates = true;
      }
    }

    const hostElementBounds = hostElement.getBoundingClientRect();

    insetBlockStart = reverseBlockCoordinates
      ? window[`inner${blockSizeLabel}`]
      : 0;
    insetInlineStart = reverseInlineCoordinates
      ? window[`inner${inlineSizeLabel}`]
      : 0;
    insetBlockEnd = reverseBlockCoordinates
      ? 0
      : window[`inner${blockSizeLabel}`];
    insetInlineEnd = reverseInlineCoordinates
      ? 0
      : window[`inner${inlineSizeLabel}`];

    const ancestorBounds = this._clippingAncestors.map((ancestor) =>
      ancestor.getBoundingClientRect()
    );
    ancestorBounds.unshift(hostElementBounds);

    const blockMax = reverseBlockCoordinates ? Math.min : Math.max;
    const blockMin = reverseBlockCoordinates ? Math.max : Math.min;
    const inlineMax = reverseInlineCoordinates ? Math.min : Math.max;
    const inlineMin = reverseInlineCoordinates ? Math.max : Math.min;

    for (const bounds of ancestorBounds) {
      insetBlockStart = blockMax(insetBlockStart, bounds[blockStartLabel]);
      insetInlineStart = inlineMax(insetInlineStart, bounds[inlineStartLabel]);
      insetBlockEnd = blockMin(insetBlockEnd, bounds[blockEndLabel]);
      insetInlineEnd = inlineMin(insetInlineEnd, bounds[inlineEndLabel]);
    }

    const scrollingElementBounds = scrollingElement.getBoundingClientRect();

    const offsets = this._computeOffsetWithinScroller({
      hostElementBounds,
      scrollingElement,
      scrollingElementBounds,
      blockStartLabel,
      inlineStartLabel,
      blockScrollPosition,
      inlineScrollPosition,
    });

    layout.offsetWithinScroller = {
      inline: offsets.inline,
      block: offsets.block,
    };

    layout.scrollSize = {
      inlineSize: scrollingElement[`scroll${inlineSizeLabel}`],
      blockSize: scrollingElement[`scroll${blockSizeLabel}`],
    };

    layout.viewportScroll = {
      inline: reverseInlineCoordinates
        ? hostElementBounds[inlineStartLabel] -
          insetInlineStart +
          inlineScrollPosition(hostElement)
        : insetInlineStart -
          hostElementBounds[inlineStartLabel] +
          inlineScrollPosition(hostElement),
      block: reverseBlockCoordinates
        ? hostElementBounds[blockStartLabel] -
          insetBlockStart +
          blockScrollPosition(hostElement)
        : insetBlockStart -
          hostElementBounds[blockStartLabel] +
          blockScrollPosition(hostElement),
    };

    // Elements with zero width AND height are inside display:none (or
    // equivalent) and should render nothing.
    const isHidden =
      hostElementBounds.width === 0 && hostElementBounds.height === 0;

    this._emitWarnings({hostElementBounds, isHidden});

    // When the host element has a zero dimension on a given axis but
    // isn't fully hidden, use a floor of 1px to bootstrap the rendering
    // cycle. Once the host has a real size on an axis, trust the
    // clipping result on that axis.
    type sizeKey = 'width' | 'height';
    const hostBlockDim =
      hostElementBounds[blockSizeLabel.toLowerCase() as sizeKey];
    const hostInlineDim =
      hostElementBounds[inlineSizeLabel.toLowerCase() as sizeKey];
    const blockFloor = !isHidden && hostBlockDim === 0 ? 1 : 0;
    const inlineFloor = !isHidden && hostInlineDim === 0 ? 1 : 0;

    const viewportBlockSize = Math.max(
      blockFloor,
      reverseBlockCoordinates
        ? insetBlockStart - insetBlockEnd
        : insetBlockEnd - insetBlockStart
    );
    const viewportInlineSize = Math.max(
      inlineFloor,
      reverseInlineCoordinates
        ? insetInlineStart - insetInlineEnd
        : insetInlineEnd - insetInlineStart
    );
    layout.viewportSize = {
      blockSize: viewportBlockSize,
      inlineSize: viewportInlineSize,
    };

    layout.writingMode = writingMode;
    layout.direction = direction;
  }

  correctScrollError(error: LogicalCoordinates): void {
    const sc = this._scrollerController!;
    const {scrollTop, scrollLeft} = sc;
    const {block, inline} = error;
    // Whether to negate the block correction depends on the SCROLLER's
    // writing-mode (vertical-rl scrollers have inverted scrollLeft).
    // Which axis (top vs left) the correction applies to depends on
    // the HOST's writing-mode, which we read from the host element.
    const blockCorrection =
      this._scrollerWritingMode === 'vertical-rl' ? -block : block;
    const hostWritingMode = getComputedStyle(this._host.hostElement)
      .writingMode as writingMode;
    sc.correctScrollError({
      top: scrollTop - (hostWritingMode === 'horizontal-tb' ? block : inline),
      left:
        scrollLeft -
        (hostWritingMode === 'horizontal-tb' ? inline : blockCorrection),
    });
  }

  scrollElementIntoView(
    options: ScrollElementIntoViewOptions,
    layout: Layout
  ): ScrollToCoordinates {
    const coordinates = layout.getScrollIntoViewCoordinates(options);
    // An already-aborted signal means "no-op": still return the
    // computed destination, but don't start any side effects (no pin,
    // no smooth scroll, no event dispatches).
    if (options.signal?.aborted) {
      return coordinates;
    }

    if (options.behavior === 'smooth') {
      // Replace any prior smooth intent so its `scrollintoviewended`
      // fires with reason `'replaced'` before we start the new one.
      if (this._intent !== null) {
        const prior = this._intent;
        this._intent = null;
        prior.replace();
      }
      this._intent = new DomSmoothIntent(
        this._host.hostElement,
        options,
        this._scrollerController!,
        layout,
        coordinates
      );
    } else {
      // Instant: pin teleports the layout's scroll position; the
      // existing `_setPositionFromPin` → `_scrollError` →
      // `correctScrollError` → native `scrollTo` chain applies the
      // scroll. No intent is tracked — the operation is effectively
      // synchronous from the consumer's perspective. The pin stays
      // set until the user scrolls (which fires `unpinned`), matching
      // the behavior of `pin` set directly via `layout.pin`.
      //
      // If a smooth intent was in flight, replace it first so its
      // `scrollintoviewended` fires with `'replaced'`.
      if (this._intent !== null) {
        const prior = this._intent;
        this._intent = null;
        prior.replace();
      }
      layout.pin = options;
    }
    return coordinates;
  }

  checkScrollIntoViewTarget(
    positions: ChildPositions | null,
    _layout: Layout
  ): void {
    this._intent?.retargetIfRendered(positions);
  }
}
