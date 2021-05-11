import EventTarget from '../polyfillLoaders/EventTarget.js';
import {Layout, Positions, ScrollDirection, Size, dimension, position, LayoutConfig} from './Layout.js';

export abstract class Layout1dBase implements Layout {
  /**
   * The last set viewport scroll position.
   */
  private _latestCoords: Positions = {left: 0, top: 0};

  /**
   * Scrolling direction.
   */
  private _direction: ScrollDirection = 'vertical';

  /**
   * Dimensions of the viewport.
   */
  private _viewportSize: Size = {width: 0, height: 0};

  /**
   * Flag for debouncing asynchnronous reflow requests.
   */
  private _pendingReflow: boolean = false;

  private _pendingLayoutUpdate: boolean = false;

  /**
   * Index of the item that has been scrolled to via the public API. When the
   * container is otherwise scrolled, this value is set back to -1.
   */
  protected _scrollToIndex: number = -1;

  /**
   * When a child is scrolled to, the offset from the top of the child and the
   * top of the viewport. Value is a proportion of the item size.
   */
  private _scrollToAnchor: number = 0;

  /**
   * The index of the first item intersecting the viewport.
   */
  private _firstVisible: number;

  /**
   * The index of the last item intersecting the viewport.
   */
  private _lastVisible: number;

  private _eventTargetPromise: Promise<void> = (EventTarget().then((Ctor) => {
    this._eventTarget = new Ctor();
  }));

  /**
   * Pixel offset in the scroll direction of the first child.
   */
  protected _physicalMin: number = 0;

  /**
   * Pixel offset in the scroll direction of the last child.
   */
  protected _physicalMax: number = 0;

  /**
   * Index of the first child.
   */
  protected _first: number = -1;

  /**
   * Index of the last child.
   */
  protected _last: number = -1;

  /**
   * The _estimated_ size of a child.
   */
  protected _itemSize: Size = {width: 100, height: 100};

  /**
   * Space in pixels between children.
   */
  protected _spacing: number = 0;

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
  protected _scrollPosition: number = 0;

  /**
   * Difference between current scroll offset and scroll offset calculated due
   * to a reflow.
   */
  protected _scrollError: number = 0;

  /**
   * Total number of items that could possibly be displayed. Used to help
   * calculate the scroll size.
   */
  protected _totalItems: number = 0;

  /**
   * The total (estimated) length of all items in the scrolling direction.
   */
  protected _scrollSize: number = 1;

  /**
   * Number of pixels beyond the visible size of the container to still include
   * in the active range of items.
   */
  // TODO (graynorton): Probably want to make this something we calculate based
  // on viewport size, item size, other factors, possibly still with a dial of some kind
  protected _overhang: number = 1000;

  private _eventTarget;
  protected _spacingChanged;

  protected static _defaultConfig: LayoutConfig = {};

  constructor(config) {
    if (config) {
      this.config = config;
    }
  }

  set config(config: LayoutConfig) {
    Object.assign(this, Object.assign({}, (<typeof Layout1dBase>this.constructor)._defaultConfig, config));
  }

  get config(): LayoutConfig {
    const config = {};
    for (let key in (<typeof Layout1dBase>this.constructor)._defaultConfig) {
      config[key] = this[key];
    }
    return config;
  }

  /**
   * Maximum index of children + 1, to help estimate total height of the scroll
   * space.
   */
  get totalItems(): number {
    return this._totalItems;
  }
  set totalItems(num) {
    const _num = Number(num);
    if (_num !== this._totalItems) {
      this._totalItems = _num;
      this._scheduleReflow();
    }
  }

  /**
   * Primary scrolling direction.
   */
  get direction(): ScrollDirection {
    return this._direction;
  }
  set direction(dir) {
    // Force it to be either horizontal or vertical.
    dir = (dir === 'horizontal') ? dir : 'vertical';
    if (dir !== this._direction) {
      this._direction = dir;
      this._sizeDim = (dir === 'horizontal') ? 'width' : 'height';
      this._secondarySizeDim = (dir === 'horizontal') ? 'height' : 'width';
      this._positionDim = (dir === 'horizontal') ? 'left' : 'top';
      this._secondaryPositionDim = (dir === 'horizontal') ? 'top' : 'left';
      this._scheduleLayoutUpdate();
    }
  }

  /**
   * Estimate of the dimensions of a single child.
   */
  get itemSize(): Size {
    return this._itemSize;
  }
  set itemSize(dims) {
    const {_itemDim1, _itemDim2} = this;
    Object.assign(this._itemSize, dims);
    if (_itemDim1 !== this._itemDim1 || _itemDim2 !== this._itemDim2) {
      if (_itemDim2 !== this._itemDim2) {
        this._itemDim2Changed();
      } else {
        this._scheduleLayoutUpdate();
      }
    }
  }

  /**
   * Amount of space in between items.
   */
  get spacing(): number {
    return this._spacing;
  }
  set spacing(px) {
    const _px = Number(px);
    if (_px !== this._spacing) {
      this._spacing = _px;
      this._scheduleLayoutUpdate();
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
      this._viewDim2Changed();
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
    if (oldPos !== this._scrollPosition) {
      this._scrollPositionChanged(oldPos, this._scrollPosition);
      this._updateVisibleIndices({emit: true});
    }
    this._checkThresholds();
  }

  /**
   * Perform a reflow if one has been scheduled.
   */
  reflowIfNeeded(force) {
    if (force || this._pendingReflow) {
      this._pendingReflow = false;
      this._reflow();
    }
  }

  /**
   * Scroll to the child at the given index, and the given position within that
   * child.
   */
  scrollToIndex(index, position = 'start') {
    if (!Number.isFinite(index))
      return;
    index = Math.min(this.totalItems, Math.max(0, index));
    this._scrollToIndex = index;
    if (position === 'nearest') {
      position = index > this._first + this._num / 2 ? 'end' : 'start';
    }
    switch (position) {
      case 'start':
        this._scrollToAnchor = 0;
        break;
      case 'center':
        this._scrollToAnchor = 0.5;
        break;
      case 'end':
        this._scrollToAnchor = 1;
        break;
      default:
        throw new TypeError(
            'position must be one of: start, center, end, nearest');
    }
    this._scheduleReflow();
  }

  async dispatchEvent(...args) {
    await this._eventTargetPromise;
    this._eventTarget.dispatchEvent(...args);
  }

  async addEventListener(...args) {
    await this._eventTargetPromise;
    this._eventTarget.addEventListener(...args);
  }

  async removeEventListener(...args) {
    await this._eventTargetPromise;
    this._eventTarget.removeEventListener(...args);
  }

  /**
   * Get the top and left positioning of the item at idx.
   */
  abstract _getItemPosition(idx: number): Positions;

  /**
   * Update _first and _last based on items that should be in the current
   * range.
   */
  abstract _getActiveItems();

  protected _itemDim2Changed() {
    // Override
  }

  protected _viewDim2Changed() {
    // Override
  }

  protected _updateLayout() {
    // Override
  }

  protected _getItemSize(_idx: number): Size {
    return {
      [this._sizeDim]: this._itemDim1,
      [this._secondarySizeDim]: this._itemDim2,
    } as unknown as Size;
  }

  /**
   * The size of an item in the scrolling direction + space between items.
   */
  protected get _delta(): number {
    return this._itemDim1 + this._spacing;
  }

  /**
   * The height or width of an item, whichever corresponds to the scrolling direction.
   */
  protected get _itemDim1(): number {
    return this._itemSize[this._sizeDim];
  }

  /**
   * The height or width of an item, whichever does NOT correspond to the scrolling direction.
   */
  protected get _itemDim2(): number {
    return this._itemSize[this._secondarySizeDim];
  }

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

  protected _reflow() {
    const {_first, _last, _scrollSize} = this;

    if (this._pendingLayoutUpdate) {
      this._updateLayout();
      this._pendingLayoutUpdate = false;
    }
    this._updateScrollSize();
    this._getActiveItems();
    this._scrollIfNeeded();
    this._updateVisibleIndices();

    if (this._scrollSize !== _scrollSize) {
      this._emitScrollSize();
    }

    if (this._first === -1 && this._last === -1) {
      // TODO: have default empty object for emitRange instead
      this._emitRange();
    } else if (
        this._first !== _first || this._last !== _last ||
        this._spacingChanged) {
      // TODO: have default empty object for emitRange instead
      this._emitRange();
      this._emitChildPositions();
    }
    this._emitScrollError();
  }

  /**
   * Estimates the total length of all items in the scrolling direction, including spacing.
   */
  protected _updateScrollSize() {
    // Ensure we have at least 1px - this allows getting at least 1 item to be
    // rendered.
    this._scrollSize = Math.max(1, this._totalItems * this._delta);
  }

  protected _scrollIfNeeded() {
    if (this._scrollToIndex === -1) {
      return;
    }
    const index = this._scrollToIndex;
    const anchor = this._scrollToAnchor;
    const pos = this._getItemPosition(index)[this._positionDim];
    const size = this._getItemSize(index)[this._sizeDim];

    const curAnchorPos = this._scrollPosition + this._viewDim1 * anchor;
    const newAnchorPos = pos + size * anchor;
    // Ensure scroll position is an integer within scroll bounds.
    const scrollPosition = Math.floor(Math.min(
        this._scrollSize - this._viewDim1,
        Math.max(0, this._scrollPosition - curAnchorPos + newAnchorPos)));
    this._scrollError += this._scrollPosition - scrollPosition;
    this._scrollPosition = scrollPosition;
  }

  protected _emitRange(inProps = undefined) {
    const detail = Object.assign(
        {
          first: this._first,
          last: this._last,
          num: this._num,
          stable: true,
          firstVisible: this._firstVisible,
          lastVisible: this._lastVisible,
        },
        inProps);
    this.dispatchEvent(new CustomEvent('rangechange', {detail}));
  }

  protected _emitScrollSize() {
    const detail = {
      [this._sizeDim]: this._scrollSize,
    };
    this.dispatchEvent(new CustomEvent('scrollsizechange', {detail}));
  }

  protected _emitScrollError() {
    if (this._scrollError) {
      const detail = {
        [this._positionDim]: this._scrollError,
        [this._secondaryPositionDim]: 0,
      };
      this.dispatchEvent(new CustomEvent('scrollerrorchange', {detail}));
      this._scrollError = 0;
    }
  }

  /**
   * Get or estimate the top and left positions of items in the current range.
   * Emit an itempositionchange event with these positions.
   */
  protected _emitChildPositions() {
    const detail = {};
    for (let idx = this._first; idx <= this._last; idx++) {
      detail[idx] = this._getItemPosition(idx);
    }
    this.dispatchEvent(new CustomEvent('itempositionchange', {detail}));
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
    if (this._viewDim1 === 0 && this._num > 0) {
      this._scheduleReflow();
    } else {
      const min = Math.max(0, this._scrollPosition - this._overhang);
      const max = Math.min(
          this._scrollSize,
          this._scrollPosition + this._viewDim1 + this._overhang);
      if (this._physicalMin > min || this._physicalMax < max) {
        this._scheduleReflow();
      }
    }
  }

  /**
   * Find the indices of the first and last items to intersect the viewport.
   * Emit a visibleindiceschange event when either index changes.
   */
  protected _updateVisibleIndices(options?) {
    if (this._first === -1 || this._last === -1) return;

    let firstVisible = this._first;
    while (
      Math.round(
        this._getItemPosition(firstVisible)[this._positionDim] +
        this._getItemSize(firstVisible)[this._sizeDim]
      )
      <=
      Math.round (this._scrollPosition)
     ) {
      firstVisible++;
    }

    let lastVisible = this._last;
    while (
      Math.round(this._getItemPosition(lastVisible)[this._positionDim])
      >=
      Math.round(this._scrollPosition + this._viewDim1)
    ) {
      lastVisible--;
    }

    if (firstVisible !== this._firstVisible || lastVisible !== this._lastVisible) {
      this._firstVisible = firstVisible;
      this._lastVisible = lastVisible;
      if (options && options.emit) {
        this._emitRange();
      }
    }
  }

  private _scrollPositionChanged(oldPos, newPos) {
    // When both values are bigger than the max scroll position, keep the
    // current _scrollToIndex, otherwise invalidate it.
    const maxPos = this._scrollSize - this._viewDim1;
    if (oldPos < maxPos || newPos < maxPos) {
      this._scrollToIndex = -1;
    }
  }
}
