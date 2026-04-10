/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  Layout,
  LogicalCoordinates,
  fixedSizeDimensionCapitalized,
  fixedInsetLabel,
  writingMode,
  direction,
} from '../layouts/shared/Layout.js';
import {ScrollerController} from '../ScrollerController.js';
import {
  ScrollSource,
  ScrollSourceHost,
  ScrollElementIntoViewOptions,
} from './ScrollSource.js';

// Module-state polyfill hook, mirroring the one in Virtualizer.ts. The
// existing code allows callers to inject a polyfilled ResizeObserver via
// `provideResizeObserver()`. AncestorScrollSource shares the same
// constructor; we look it up via the global at construction time.
let _ResizeObserver: typeof ResizeObserver | undefined =
  typeof window !== 'undefined' ? window.ResizeObserver : undefined;

/**
 * Inject a `ResizeObserver` polyfill that AncestorScrollSource will use
 * instead of the global. Mirrors `provideResizeObserver()` in
 * Virtualizer.ts; both must be called for full coverage.
 */
export function provideResizeObserver(Ctor: typeof ResizeObserver) {
  _ResizeObserver = Ctor;
}

/**
 * Returns the effective parent element of `el`, traversing across
 * shadow DOM boundaries. Mirrors the helper in `Virtualizer.ts`. The
 * three cases handled:
 *
 *   1. `el.assignedSlot` — when the element is slotted into a shadow
 *      root, the slot is its effective parent in the flat tree.
 *   2. `el.parentElement` — normal DOM parent.
 *   3. A `DocumentFragment` parent that is a `ShadowRoot` — escape from
 *      the shadow root to its host.
 *
 * TODO: Deal with iframes.
 */
function getParentElement(el: Element): Element | null {
  if (el.assignedSlot !== null) {
    return el.assignedSlot;
  }
  if (el.parentElement !== null) {
    return el.parentElement;
  }
  const parentNode = el.parentNode;
  if (parentNode && parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    return (parentNode as ShadowRoot).host || null;
  }
  return null;
}

/**
 * Walks up the DOM tree starting from `el` (optionally including `el`
 * itself) and collects ancestors. Traverses across shadow DOM boundaries
 * via `getParentElement()`.
 */
function getElementAncestors(el: HTMLElement, includeSelf = false) {
  const ancestors: HTMLElement[] = [];
  let parent = includeSelf ? el : (getParentElement(el) as HTMLElement | null);
  while (parent !== null) {
    ancestors.push(parent);
    parent = getParentElement(parent) as HTMLElement | null;
  }
  return ancestors;
}

/**
 * Returns the chain of clipping ancestors above `el`. A clipping ancestor
 * is one whose computed `overflow` is not `visible`. Stops walking after
 * encountering a `position: fixed` ancestor (since fixed positioning
 * detaches an element from its scroll context).
 *
 * Excludes `display: contents` ancestors because they generate no box
 * and have no meaningful overflow.
 *
 * This is the ancestor-mode variant: `el` itself is not included in the
 * result. (Self-scroller mode uses an analogous helper that includes
 * `el`.)
 */
function getClippingAncestors(el: HTMLElement) {
  let foundFixed = false;
  return getElementAncestors(el, false).filter((a) => {
    if (foundFixed) {
      return false;
    }
    const style = getComputedStyle(a);
    foundFixed = style.position === 'fixed';
    if (style.display === 'contents') {
      return false;
    }
    return style.overflow !== 'visible';
  });
}

/**
 * `ScrollSource` implementation for the default mode where the
 * window or a clipping ancestor is the scroll container.
 *
 * Owns the `ScrollerController`, scroll listeners on window and all
 * clipping ancestors, a `ResizeObserver` watching host/ancestors/scroller,
 * and the window resize listener.
 *
 * Most of the `updateView()` body is a direct port of the corresponding
 * code that previously lived in `Virtualizer._updateView()`.
 */
export class AncestorScrollSource implements ScrollSource {
  readonly isSelfScroller = false;

  get correctingScrollError(): boolean {
    return this._scrollerController?.correctingScrollError ?? false;
  }

  /**
   * The source's internal `ScrollerController`. Exposed publicly so that
   * `Virtualizer` can hold a read-only reference for use in code paths
   * that have not yet been migrated into the source (notably the
   * smooth-scroll orchestration in `_scrollElementIntoView`, which
   * tracks per-frame retarget state on the Virtualizer instance). This
   * is a transitional accessor: after Step 4 of the refactor, Virtualizer
   * should no longer hold its own ScrollerController reference.
   */
  get scrollerController(): ScrollerController | null {
    return this._scrollerController;
  }

  private _host: ScrollSourceHost;
  private _clippingAncestors: HTMLElement[] = [];
  private _scrollerController: ScrollerController | null = null;
  private _hostElementRO: ResizeObserver | null = null;
  private _windowResizeCallback: (() => void) | null = null;
  private _scrollEventListeners: (Element | Window)[] = [];
  private _scrollEventListenerOptions: AddEventListenerOptions = {
    passive: true,
  };
  // Cached during the most recent updateView() so correctScrollError()
  // can perform writing-mode-aware coordinate conversion without
  // re-reading computed styles.
  private _scrollerWritingMode: writingMode = 'unknown';
  // EventListenerObject implementation: scroll/resize events are
  // dispatched here. Defined as an arrow-bound method below.
  private _eventHandler: EventListenerObject;

  constructor(host: ScrollSourceHost) {
    this._host = host;
    this._eventHandler = {
      handleEvent: (event: Event) => this._onScrollOrResize(event),
    };
  }

  connect(): void {
    const hostElement = this._host.hostElement;

    this._clippingAncestors = getClippingAncestors(hostElement);
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
  }

  private _onScrollOrResize(event: Event) {
    if (event.type !== 'scroll') {
      // Not currently expected (we only attach scroll/resize), but be
      // defensive in case the listener is wired to additional events.
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

    // Ancestor mode: offsetWithinScroller is computed from the host's
    // position relative to the scroller. (Self-scroller mode would set
    // these to 0; that path lives in SelfScrollSource.)
    let offsetBlock =
      hostElementBounds[blockStartLabel] -
      scrollingElementBounds[blockStartLabel];
    let offsetInline =
      hostElementBounds[inlineStartLabel] -
      scrollingElementBounds[inlineStartLabel];
    if (!scrollerController.isDocumentScroller) {
      offsetBlock += blockScrollPosition(scrollingElement);
      offsetInline += inlineScrollPosition(scrollingElement);
    }

    layout.offsetWithinScroller = {
      inline: offsetInline,
      block: offsetBlock,
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

    // Note: the zero-size warning is self-scroller-specific and lives
    // in SelfScrollSource (or, in Step 3, still in Virtualizer's inline
    // self-scroller path).

    // When the host element has a zero dimension on a given axis but
    // isn't fully hidden, use a floor of 1px to bootstrap the rendering
    // cycle. Once the host has a real size on an axis, trust the
    // clipping result on that axis — including zero when legitimately
    // clipped by ancestors.
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
    // writing-mode (vertical-rl scrollers have inverted scrollLeft), not
    // the host's. Which axis (top vs left) the correction applies to
    // depends on the HOST's writing-mode, which we read from the layout.
    const blockCorrection =
      this._scrollerWritingMode === 'vertical-rl' ? -block : block;
    // For ancestor mode, the host writing mode that determines top vs
    // left is whatever the most recent updateView() saw. We can read it
    // from the layout (which we set in updateView) to avoid re-querying
    // computed styles here.
    const hostWritingMode = this._readHostWritingMode();
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
  ): void {
    if (options.behavior === 'smooth') {
      const coordinates = layout.getScrollIntoViewCoordinates(options);
      const {behavior} = options;
      // The Virtualizer manages tracking the smooth-scroll target across
      // frames; this method is invoked from Virtualizer._scrollElementIntoView
      // which sets up the relevant state. We just kick off the managed
      // scroll here. Returning the updater function would require an
      // interface change; for Step 3 we accept that smooth scrolling
      // through this entry point is fire-and-forget. Virtualizer's
      // existing managedScrollTo flow is preserved by routing through
      // this source's _scrollerController.
      this._scrollerController!.managedScrollTo(
        Object.assign(coordinates, {behavior}),
        () => layout.getScrollIntoViewCoordinates(options),
        () => {}
      );
    } else {
      layout.pin = options;
    }
  }

  /**
   * Reads the host element's writing mode from its computed style. Used
   * by `correctScrollError()` to determine which physical axis to apply
   * a correction to. We read it lazily here (rather than caching from
   * `updateView`) so that the value is always current with respect to
   * recent style changes.
   */
  private _readHostWritingMode(): writingMode {
    return getComputedStyle(this._host.hostElement).writingMode as writingMode;
  }
}
