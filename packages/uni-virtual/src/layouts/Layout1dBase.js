import EventTarget from '../polyfillLoaders/EventTarget.js';

export class Layout1dBase {
  constructor(config) {
    this._physicalMin = 0;
    this._physicalMax = 0;

    this._first = -1;
    this._last = -1;

    this._latestCoords = {left: 0, top: 0};

    this._itemSize = {width: 100, height: 100};
    this._spacing = 0;

    this._sizeDim = 'height';
    this._secondarySizeDim = 'width';
    this._positionDim = 'top';
    this._secondaryPositionDim = 'left';
    this._direction = 'vertical';

    this._scrollPosition = 0;
    this._scrollError = 0;
    this._viewportSize = {width: 0, height: 0};
    this._totalItems = 0;

    this._scrollSize = 1;

    /**
     * Number of pixels beyond the visible size of the container to still include in the
     * active range of items.
     */
    this._overhang = 150;

    this._pendingReflow = false;

    this._scrollToIndex = -1;
    this._scrollToAnchor = 0;

    this._eventTargetPromise = (EventTarget().then(Ctor => this._eventTarget = new Ctor()));

    Object.assign(this, config);
  }

  // public properties

  get totalItems() {
    return this._totalItems;
  }
  set totalItems(num) {
    if (num !== this._totalItems) {
      this._totalItems = num;
      this._scheduleReflow();
    }
  }

  get direction() {
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
      this._scheduleReflow();
    }
  }

  get itemSize() {
    return this._itemSize;
  }
  set itemSize(dims) {
    const {_itemDim1, _itemDim2} = this;
    Object.assign(this._itemSize, dims);
    if (_itemDim1 !== this._itemDim1 || _itemDim2 !== this._itemDim2) {
      if (_itemDim2 !== this._itemDim2) {
        this._itemDim2Changed();
      } else {
        this._scheduleReflow();
      }
    }
  }

  /**
   * The amount of space in between items.
   */
  get spacing() {
    return this._spacing;
  }
  set spacing(px) {
    if (px !== this._spacing) {
      this._spacing = px;
      this._scheduleReflow();
    }
  }

  get viewportSize() {
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

  get viewportScroll() {
    return this._latestCoords;
  }
  set viewportScroll(coords) {
    Object.assign(this._latestCoords, coords);
    const oldPos = this._scrollPosition;
    this._scrollPosition = this._latestCoords[this._positionDim];
    if (oldPos !== this._scrollPosition) {
      this._scrollPositionChanged(oldPos, this._scrollPosition);
    }
    this._checkThresholds();
  }

  // private properties

  /**
   * The size of an item in the scrolling direction + space between items.
   * @private
   */
  get _delta() {
    return this._itemDim1 + this._spacing;
  }

  /**
   * The height or width of an item, whichever corresponds to the scrolling direction.
   * @private
   */
  get _itemDim1() {
    return this._itemSize[this._sizeDim];
  }

  /**
   * The height or width of an item, whichever does NOT correspond to the scrolling direction.
   * @private
   */
  get _itemDim2() {
    return this._itemSize[this._secondarySizeDim];
  }

  /**
   * The height or width of the viewport, whichever corresponds to the scrolling direction.
   * @private
   */
  get _viewDim1() {
    return this._viewportSize[this._sizeDim];
  }

  /**
   * The height or width of the viewport, whichever does NOT correspond to the scrolling direction.
   * @private
   */
  get _viewDim2() {
    return this._viewportSize[this._secondarySizeDim];
  }

  /**
   * Number of items to display.
   * @private
   */
  get _num() {
    if (this._first === -1 || this._last === -1) {
      return 0;
    }
    return this._last - this._first + 1;
  }

  // public methods

  reflowIfNeeded() {
    if (this._pendingReflow) {
      this._pendingReflow = false;
      this._reflow();
    }
  }

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
    this.reflowIfNeeded();
  }

  ///

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

  ///

  _scheduleReflow() {
    this._pendingReflow = true;
  }

  _reflow() {
    const {_first, _last, _scrollSize} = this;

    this._updateScrollSize();
    this._getActiveItems();
    this._scrollIfNeeded();

    if (this._scrollSize !== _scrollSize) {
      this._emitScrollSize();
    }

    if (this._first === -1 && this._last === -1) {
      this._emitRange();
    } else if (
        this._first !== _first || this._last !== _last ||
        this._spacingChanged) {
      this._emitRange();
      this._emitChildPositions();
    }
    this._emitScrollError();
  }

  /**
   * Estimates the total length of all items in the scrolling direction, including spacing.
   */
  _updateScrollSize() {
    // Ensure we have at least 1px - this allows getting at least 1 item to be
    // rendered.
    this._scrollSize = Math.max(1, this._totalItems * this._delta);
  }

  _checkThresholds() {
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

  _scrollIfNeeded() {
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

  _emitRange(inProps) {
    const detail = Object.assign(
        {
          first: this._first,
          last: this._last,
          num: this._num,
          stable: true,
        },
        inProps);
    this.dispatchEvent(new CustomEvent('rangechange', {detail}));
  }

  _emitScrollSize() {
    const detail = {
      [this._sizeDim]: this._scrollSize,
    };
    this.dispatchEvent(new CustomEvent('scrollsizechange', {detail}));
  }

  _emitScrollError() {
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
  _emitChildPositions() {
    const detail = {};
    for (let idx = this._first; idx <= this._last; idx++) {
      detail[idx] = this._getItemPosition(idx);
    }
    this.dispatchEvent(new CustomEvent('itempositionchange', {detail}));
  }

  _itemDim2Changed() {
    // Override
  }

  _viewDim2Changed() {
    // Override
  }

  _scrollPositionChanged(oldPos, newPos) {
    // When both values are bigger than the max scroll position, keep the
    // current _scrollToIndex, otherwise invalidate it.
    const maxPos = this._scrollSize - this._viewDim1;
    if (oldPos < maxPos || newPos < maxPos) {
      this._scrollToIndex = -1;
    }
  }

  _getActiveItems() {
    // Override
  }

  /**
   * Returns the top and left positioning of the item at idx.
   * @param {number} idx 
   * @return {{
    *  top: number,
    *  left: number
    * }}
    */
  _getItemPosition(idx) {
    // Override.
  }

  _getItemSize(idx) {
    // Override.
    return {
      [this._sizeDim]: this._itemDim1,
      [this._secondarySizeDim]: this._itemDim2,
    };
  }
}
