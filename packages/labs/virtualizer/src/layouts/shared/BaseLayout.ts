/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  Layout,
  ChildPositions,
  Positions,
  ScrollDirection,
  Size,
  dimension,
  position,
  PinOptions,
  ScrollToCoordinates,
  BaseLayoutConfig,
  StateChangedMessage,
  LayoutHostSink,
} from './Layout.js';

type UpdateVisibleIndicesOptions = {
  emit?: boolean;
};

export function dim1(direction: ScrollDirection): dimension {
  return direction === 'horizontal' ? 'width' : 'height';
}

export function dim2(direction: ScrollDirection): dimension {
  return direction === 'horizontal' ? 'height' : 'width';
}

export function pos1(direction: ScrollDirection): position {
  return direction === 'horizontal' ? 'left' : 'top';
}

export function pos2(direction: ScrollDirection): position {
  return direction === 'horizontal' ? 'top' : 'left';
}

export abstract class BaseLayout<C extends BaseLayoutConfig> implements Layout {
  /**
   * The last set viewport scroll position.
   */
  private _latestCoords: Positions = {left: 0, top: 0};

  /**
   * Scrolling direction.
   */
  private _direction: ScrollDirection | null = null;

  /**
   * Dimensions of the viewport.
   */
  private _viewportSize: Size = {width: 0, height: 0};

  public totalScrollSize: Size = {width: 0, height: 0};

  public offsetWithinScroller: Positions = {left: 0, top: 0};

  /**
   * Flag for debouncing asynchronous reflow requests.
   */
  private _pendingReflow = false;

  private _pendingLayoutUpdate = false;

  protected _pin: PinOptions | null = null;

  /**
   * The index of the first item intersecting the viewport.
   */
  protected _firstVisible = 0;

  /**
   * The index of the last item intersecting the viewport.
   */
  protected _lastVisible = 0;

  /**
   * Pixel offset in the scroll direction of the first child.
   */
  protected _physicalMin = 0;

  /**
   * Pixel offset in the scroll direction of the last child.
   */
  protected _physicalMax = 0;

  /**
   * Index of the first child.
   */
  protected _first = -1;

  /**
   * Index of the last child.
   */
  protected _last = -1;

  /**
   * Length in the scrolling direction.
   */
  protected _sizeDim: dimension = 'height';

  /**
   * Length in the non-scrolling direction.
   */
  protected _secondarySizeDim: dimension = 'width';

  /**
   * Position in the scrolling direction.
   */
  protected _positionDim: position = 'top';

  /**
   * Position in the non-scrolling direction.
   */
  protected _secondaryPositionDim: position = 'left';

  /**
   * Current scroll offset in pixels.
   */
  protected _scrollPosition = 0;

  /**
   * Difference between current scroll offset and scroll offset calculated due
   * to a reflow.
   */
  protected _scrollError = 0;

  /**
   * Total number of items that could possibly be displayed. Used to help
   * calculate the scroll size.
   */
  protected _items: unknown[] = [];

  /**
   * The total (estimated) length of all items in the scrolling direction.
   */
  protected _scrollSize = 1;

  /**
   * Number of pixels beyond the viewport to still include
   * in the active range of items.
   */
  // TODO (graynorton): Probably want to make this something we calculate based
  // on viewport size, item size, other factors, possibly still with a dial of some kind
  protected _overhang = 1000;

  /**
   * Call this to deliver messages (e.g. stateChanged, unpinned) to host
   */
  private _hostSink: LayoutHostSink;

  protected _getDefaultConfig(): C {
    return {
      direction: 'vertical',
    } as C;
  }

  constructor(hostSink: LayoutHostSink, config?: C) {
    this._hostSink = hostSink;
    // Delay setting config so that subclasses do setup work first
    Promise.resolve().then(
      () => (this.config = config || this._getDefaultConfig())
    );
  }

  set config(config: C) {
    Object.assign(this, Object.assign({}, this._getDefaultConfig(), config));
  }

  get config(): C {
    return {
      direction: this.direction,
    } as C;
  }

  /**
   * Maximum index of children + 1, to help estimate total height of the scroll
   * space.
   */
  get items(): unknown[] {
    return this._items;
  }

  set items(items: unknown[]) {
    this._setItems(items);
  }

  protected _setItems(items: unknown[]) {
    if (items !== this._items) {
      this._items = items;
      this._scheduleReflow();
    }
  }

  /**
   * Primary scrolling direction.
   */
  get direction(): ScrollDirection {
    return this._direction!;
  }
  set direction(dir) {
    // Force it to be either horizontal or vertical.
    dir = dir === 'horizontal' ? dir : 'vertical';
    if (dir !== this._direction) {
      this._direction = dir;
      this._sizeDim = dir === 'horizontal' ? 'width' : 'height';
      this._secondarySizeDim = dir === 'horizontal' ? 'height' : 'width';
      this._positionDim = dir === 'horizontal' ? 'left' : 'top';
      this._secondaryPositionDim = dir === 'horizontal' ? 'top' : 'left';
      this._triggerReflow();
    }
  }

  /**
   * Height and width of the viewport.
   */
  get viewportSize(): Size {
    return this._viewportSize;
  }
  set viewportSize(dims) {
    const {_viewDim1, _viewDim2} = this;
    Object.assign(this._viewportSize, dims);
    if (_viewDim2 !== this._viewDim2) {
      // this._viewDim2Changed();
      this._scheduleLayoutUpdate();
    } else if (_viewDim1 !== this._viewDim1) {
      this._checkThresholds();
    }
  }

  /**
   * Scroll offset of the viewport.
   */
  get viewportScroll(): Positions {
    return this._latestCoords;
  }
  set viewportScroll(coords) {
    Object.assign(this._latestCoords, coords);
    const oldPos = this._scrollPosition;
    this._scrollPosition = this._latestCoords[this._positionDim];
    const change = Math.abs(oldPos - this._scrollPosition);
    if (change >= 1) {
      this._checkThresholds();
    }
  }

  /**
   * Perform a reflow if one has been scheduled.
   */
  reflowIfNeeded(force = false) {
    if (force || this._pendingReflow) {
      this._pendingReflow = false;
      this._reflow();
    }
  }

  set pin(options: PinOptions | null) {
    this._pin = options;
    this._triggerReflow();
  }

  get pin() {
    if (this._pin !== null) {
      const {index, block} = this._pin;
      return {
        index: Math.max(0, Math.min(index, this.items.length - 1)),
        block,
      };
    }
    return null;
  }

  _clampScrollPosition(val: number) {
    return Math.max(
      -this.offsetWithinScroller[this._positionDim],
      Math.min(val, this.totalScrollSize[dim1(this.direction)] - this._viewDim1)
    );
  }

  unpin() {
    if (this._pin !== null) {
      this._sendUnpinnedMessage();
      this._pin = null;
    }
  }

  /**
   * Get the top and left positioning of the item at idx.
   */
  protected abstract _getItemPosition(idx: number): Positions;

  /**
   * Update _first and _last based on items that should be in the current
   * range.
   */
  protected abstract _getActiveItems(): void;

  protected abstract _getItemSize(_idx: number): Size;

  /**
   * Calculates (precisely or by estimating, if needed) the total length of all items in
   * the scrolling direction, including spacing, caching the value in the `_scrollSize` field.
   *
   * Should return a minimum value of 1 to ensure at least one item is rendered.
   * TODO (graynorton): Possibly no longer required, but leaving here until it can be verified.
   */
  protected abstract _updateScrollSize(): void;

  protected _updateLayout(): void {
    // Override
  }

  // protected _viewDim2Changed(): void {
  //   this._scheduleLayoutUpdate();
  // }

  /**
   * The height or width of the viewport, whichever corresponds to the scrolling direction.
   */
  protected get _viewDim1(): number {
    return this._viewportSize[this._sizeDim];
  }

  /**
   * The height or width of the viewport, whichever does NOT correspond to the scrolling direction.
   */
  protected get _viewDim2(): number {
    return this._viewportSize[this._secondarySizeDim];
  }

  protected _scheduleReflow() {
    this._pendingReflow = true;
  }

  protected _scheduleLayoutUpdate() {
    this._pendingLayoutUpdate = true;
    this._scheduleReflow();
  }

  // For triggering a reflow based on incoming changes to
  // the layout config.
  protected _triggerReflow() {
    this._scheduleLayoutUpdate();
    // TODO graynorton@: reflowIfNeeded() isn't really supposed
    // to be called internally. Address in larger cleanup
    // of virtualizer / layout interaction pattern.
    // this.reflowIfNeeded(true);
    Promise.resolve().then(() => this.reflowIfNeeded());
  }

  protected _reflow() {
    if (this._pendingLayoutUpdate) {
      this._updateLayout();
      this._pendingLayoutUpdate = false;
    }
    this._updateScrollSize();
    this._setPositionFromPin();
    this._getActiveItems();
    this._updateVisibleIndices();
    this._sendStateChangedMessage();
  }

  /**
   * If we are supposed to be pinned to a particular
   * item or set of coordinates, we set `_scrollPosition`
   * accordingly and adjust `_scrollError` as needed
   * so that the virtualizer can keep the scroll
   * position in the DOM in sync
   */
  protected _setPositionFromPin() {
    if (this.pin !== null) {
      const lastScrollPosition = this._scrollPosition;
      const {index, block} = this.pin;
      this._scrollPosition =
        this._calculateScrollIntoViewPosition({
          index,
          block: block || 'start',
        }) - this.offsetWithinScroller[this._positionDim];
      this._scrollError = lastScrollPosition - this._scrollPosition;
    }
  }
  /**
   * Calculate the coordinates to scroll to, given
   * a request to scroll to the element at a specific
   * index.
   *
   * Supports the same positioning options (`start`,
   * `center`, `end`, `nearest`) as the standard
   * `Element.scrollIntoView()` method, but currently
   * only considers the provided value in the `block`
   * dimension, since we don't yet have any layouts
   * that support virtualization in two dimensions.
   */
  protected _calculateScrollIntoViewPosition(options: PinOptions) {
    const {block} = options;
    const index = Math.min(this.items.length, Math.max(0, options.index));
    const itemStartPosition = this._getItemPosition(index)[this._positionDim];
    let scrollPosition = itemStartPosition;
    if (block !== 'start') {
      const itemSize = this._getItemSize(index)[this._sizeDim];
      if (block === 'center') {
        scrollPosition =
          itemStartPosition - 0.5 * this._viewDim1 + 0.5 * itemSize;
      } else {
        const itemEndPosition = itemStartPosition - this._viewDim1 + itemSize;
        if (block === 'end') {
          scrollPosition = itemEndPosition;
        } else {
          // block === 'nearest'
          const currentScrollPosition = this._scrollPosition;
          scrollPosition =
            Math.abs(currentScrollPosition - itemStartPosition) <
            Math.abs(currentScrollPosition - itemEndPosition)
              ? itemStartPosition
              : itemEndPosition;
        }
      }
    }
    scrollPosition += this.offsetWithinScroller[this._positionDim];
    return this._clampScrollPosition(scrollPosition);
  }

  public getScrollIntoViewCoordinates(
    options: PinOptions
  ): ScrollToCoordinates {
    return {
      [this._positionDim as position]:
        this._calculateScrollIntoViewPosition(options),
    } as ScrollToOptions;
  }

  private _sendUnpinnedMessage() {
    this._hostSink({
      type: 'unpinned',
    });
  }

  private _sendVisibilityChangedMessage() {
    this._hostSink({
      type: 'visibilityChanged',
      firstVisible: this._firstVisible,
      lastVisible: this._lastVisible,
    });
  }

  protected _sendStateChangedMessage() {
    const childPositions: ChildPositions = new Map();
    if (this._first !== -1 && this._last !== -1) {
      for (let idx = this._first; idx <= this._last; idx++) {
        childPositions.set(idx, this._getItemPosition(idx));
      }
    }
    const message: StateChangedMessage = {
      type: 'stateChanged',
      scrollSize: {
        [this._sizeDim]: this._scrollSize,
        [this._secondarySizeDim]: null,
      } as Size,
      range: {
        first: this._first,
        last: this._last,
        firstVisible: this._firstVisible,
        lastVisible: this._lastVisible,
      },
      childPositions,
    };
    if (this._scrollError) {
      message.scrollError = {
        [this._positionDim]: this._scrollError,
        [this._secondaryPositionDim]: 0,
      } as Positions;
      this._scrollError = 0;
    }
    this._hostSink(message);
  }

  /**
   * Number of items to display.
   */
  private get _num(): number {
    if (this._first === -1 || this._last === -1) {
      return 0;
    }
    return this._last - this._first + 1;
  }

  private _checkThresholds() {
    if ((this._viewDim1 === 0 && this._num > 0) || this._pin !== null) {
      this._scheduleReflow();
    } else {
      const min = Math.max(0, this._scrollPosition - this._overhang);
      const max = Math.min(
        this._scrollSize,
        this._scrollPosition + this._viewDim1 + this._overhang
      );
      if (this._physicalMin > min || this._physicalMax < max) {
        this._scheduleReflow();
      } else {
        this._updateVisibleIndices({emit: true});
      }
    }
  }

  /**
   * Find the indices of the first and last items to intersect the viewport.
   * Emit a visibleindiceschange event when either index changes.
   */
  protected _updateVisibleIndices(options?: UpdateVisibleIndicesOptions) {
    if (this._first === -1 || this._last === -1) return;

    let firstVisible = this._first;
    while (
      firstVisible < this._last &&
      Math.round(
        this._getItemPosition(firstVisible)[this._positionDim] +
          this._getItemSize(firstVisible)[this._sizeDim]
      ) <= Math.round(this._scrollPosition)
    ) {
      firstVisible++;
    }

    let lastVisible = this._last;
    while (
      lastVisible > this._first &&
      Math.round(this._getItemPosition(lastVisible)[this._positionDim]) >=
        Math.round(this._scrollPosition + this._viewDim1)
    ) {
      lastVisible--;
    }

    if (
      firstVisible !== this._firstVisible ||
      lastVisible !== this._lastVisible
    ) {
      this._firstVisible = firstVisible;
      this._lastVisible = lastVisible;
      if (options && options.emit) {
        this._sendVisibilityChangedMessage();
      }
    }
  }
}
