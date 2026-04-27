/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {SizeCache} from './shared/SizeCache.js';
import {BaseLayout} from './shared/BaseLayout.js';
import {
  Positions,
  LogicalSize,
  ChildLayoutInfo,
  BaseLayoutConfig,
  LayoutHostSink,
  PinOptions,
} from './shared/Layout.js';

type ItemBounds = {
  pos: number;
  size: number;
};

type FlowLayoutConstructor = {
  prototype: FlowLayout;
  new (hostSink: LayoutHostSink, config?: BaseLayoutConfig): FlowLayout;
};

type FlowLayoutSpecifier = BaseLayoutConfig & {
  type: FlowLayoutConstructor;
};

type FlowLayoutSpecifierFactory = (
  config?: BaseLayoutConfig
) => FlowLayoutSpecifier;

export const flow: FlowLayoutSpecifierFactory = (config?: BaseLayoutConfig) =>
  Object.assign(
    {
      type: FlowLayout,
    },
    config
  );

function collapseMargins(a: number, b: number): number {
  const m = [a, b].sort();
  return m[1] <= 0 ? Math.min(...m) : m[0] >= 0 ? Math.max(...m) : m[0] + m[1];
}

class MetricsCache {
  private _childSizeCache = new SizeCache();
  private _marginSizeCache = new SizeCache();
  private _metricsCache: ChildLayoutInfo = new Map();

  update(metrics: ChildLayoutInfo) {
    const marginsToUpdate = new Set<number>();
    metrics.forEach((childMetrics, key) => {
      this._metricsCache.set(key, childMetrics);
      this._childSizeCache.set(key, childMetrics.blockSize);
      marginsToUpdate.add(key);
      marginsToUpdate.add(key + 1);
    });
    for (const k of marginsToUpdate) {
      // Skip index 0: there's no preceding item, so the collapsed margin
      // is just the first item's leading margin, not an inter-item margin.
      // Including it would skew the average used for position estimation.
      if (k === 0) continue;
      const a = this._metricsCache.get(k)?.marginBlockStart || 0;
      const b = this._metricsCache.get(k - 1)?.marginBlockEnd || 0;
      this._marginSizeCache.set(k, collapseMargins(a, b));
    }
  }

  get averageChildSize(): number {
    return this._childSizeCache.averageSize;
  }

  get totalChildSize(): number {
    return this._childSizeCache.totalSize;
  }

  get averageMarginSize(): number {
    return this._marginSizeCache.averageSize;
  }

  get totalMarginSize(): number {
    return this._marginSizeCache.totalSize;
  }

  getLeadingMarginValue(index: number) {
    return this._metricsCache.get(index)?.marginBlockStart || 0;
  }

  getChildSize(index: number) {
    return this._childSizeCache.getSize(index);
  }

  getMarginSize(index: number) {
    if (index === 0) {
      return this.getLeadingMarginValue(0);
    }
    return this._marginSizeCache.getSize(index);
  }

  clearOutsideRange(first: number, last: number) {
    this._childSizeCache.clearOutsideRange(first, last);
    this._marginSizeCache.clearOutsideRange(first, last);
    for (const key of this._metricsCache.keys()) {
      if (key < first || key > last) {
        this._metricsCache.delete(key);
      }
    }
  }

  clear() {
    this._childSizeCache.clear();
    this._marginSizeCache.clear();
    this._metricsCache.clear();
  }
}

export class FlowLayout extends BaseLayout<BaseLayoutConfig> {
  /**
   * Initial estimate of item size
   */
  _itemSize: LogicalSize = {inlineSize: 100, blockSize: 100};

  /**
   * Indices of children mapped to their (position and length) in the scrolling
   * direction. Used to keep track of children that are in range.
   */
  _physicalItems = new Map<number, ItemBounds>();

  /**
   * Used in tandem with _physicalItems to track children in range across
   * reflows.
   */
  _newPhysicalItems = new Map<number, ItemBounds>();

  /**
   * Width and height of children by their index.
   */
  _metricsCache = new MetricsCache();

  /**
   * anchorIdx is the anchor around which we reflow. It is designed to allow
   * jumping to any point of the scroll size. We choose it once and stick with
   * it until stable. _first and _last are deduced around it.
   */
  _anchorIdx: number | null = null;

  /**
   * Position in the scrolling direction of the anchor child.
   */
  _anchorPos: number | null = null;

  /**
   * Whether all children in range were in range during the previous reflow.
   */
  _stable = true;

  _estimate = true;

  /**
   * Tracks the last-seen inline dimension so we can detect when the
   * cross-axis size changes (e.g. container resized horizontally while
   * scrolling vertically). When this happens, cached block sizes for
   * off-screen items are stale and must be cleared so they don't
   * poison the average used for position estimation.
   */
  _lastViewDim2: number | null = null;

  /**
   * When set, the next significant change to _virtualizerSize (in
   * _updateVirtualizerSize) should trigger a proportional scroll
   * correction. Set after a cross-axis resize clears off-screen
   * cache entries, since the resulting size change would otherwise
   * shift the scroll thumb away from its correct position.
   */
  _pendingScrollCorrection: number | null = null;

  override unfreeze() {
    super.unfreeze();
    // Clear stale state so the next reflow starts fresh from the
    // current scroll position. Set _pendingScrollCorrection so that
    // when post-unfreeze measurements change the average (and thus
    // _virtualizerSize), scrollTop scales proportionally to maintain
    // the correct thumb position.
    this._pendingScrollCorrection = this._virtualizerSize;
    this._metricsCache.clearOutsideRange(this._first, this._last);
    // Set to null so _updateLayout skips dim2 change detection on
    // the first post-unfreeze reflow (preventing _pendingScrollCorrection
    // from being re-set due to scrollbar width changes). _updateLayout
    // will set it to the current value at the end of that reflow.
    this._lastViewDim2 = null;
    this._anchorIdx = null;
    this._anchorPos = null;
    // Clear physical items so _estimatePosition uses uniform spacing
    // from position 0, consistent with _calculateAnchor's assumptions.
    // Stale physical items at non-uniform positions cause the estimate
    // to diverge from the anchor calculation.
    this._physicalItems.clear();
    this._first = -1;
    this._last = -1;
  }

  protected _updateLayout(): void {
    if (this._lastViewDim2 !== null && this._viewDim2 !== this._lastViewDim2) {
      this._metricsCache.clearOutsideRange(this._first, this._last);
      this._pendingScrollCorrection = this._virtualizerSize;
    }
    this._lastViewDim2 = this._viewDim2;
  }

  /**
   * Determine the average size of all children represented in the sizes
   * argument.
   */
  updateItemSizes(childLayoutInfo: ChildLayoutInfo) {
    this._metricsCache.update(childLayoutInfo);
    // if (this._nMeasured) {
    // this._updateItemSize();
    this._scheduleReflow();
    // }
  }

  /**
   * Set the average item size based on the total length and number of children
   * in range.
   */
  // _updateItemSize() {
  //   // Keep integer values.
  //   this._itemSize[this._sizeDim] = this._metricsCache.averageChildSize;
  // }

  _getPhysicalItem(idx: number): ItemBounds | undefined {
    return this._newPhysicalItems.get(idx) ?? this._physicalItems.get(idx);
  }

  _getSize(idx: number): number | undefined {
    const item = this._getPhysicalItem(idx);
    return item && this._metricsCache.getChildSize(idx);
  }

  _getAverageSize(): number {
    return this._metricsCache.averageChildSize || this._itemSize.blockSize;
  }

  _estimatePosition(idx: number): number {
    const c = this._metricsCache;
    // Use `_getAverageSize()` rather than `c.averageChildSize` directly:
    // the cache is empty until measurements arrive, in which case
    // `averageChildSize` is 0 and the extrapolation below would
    // collapse — every unrendered index would resolve to the same
    // position. `_getAverageSize()` falls back to the layout's
    // configured initial estimate (`_itemSize.blockSize`) so positions
    // remain monotonic even before the first measurements land.
    const avgSize = this._getAverageSize();
    const avgMargin = c.averageMarginSize;
    if (this._first === -1 || this._last === -1) {
      return avgMargin + idx * (avgMargin + avgSize);
    } else {
      if (idx < this._first) {
        const delta = this._first - idx;
        const refItem = this._getPhysicalItem(this._first);
        return (
          refItem!.pos -
          (c.getMarginSize(this._first) || avgMargin) -
          (delta * avgSize + (delta - 1) * avgMargin)
        );
      } else {
        const delta = idx - this._last;
        const refItem = this._getPhysicalItem(this._last);
        return (
          refItem!.pos +
          (c.getChildSize(this._last) || avgSize) +
          (c.getMarginSize(this._last + 1) || avgMargin) +
          (delta - 1) * (avgSize + avgMargin)
        );
      }
    }
  }

  /**
   * Returns the position in the scrolling direction of the item at idx.
   * Estimates it if the item at idx is not in the DOM.
   */
  _getPosition(idx: number): number {
    const item = this._getPhysicalItem(idx);
    const {averageMarginSize} = this._metricsCache;
    return idx === 0
      ? (this._metricsCache.getMarginSize(0) ?? averageMarginSize)
      : item
        ? item.pos
        : this._estimatePosition(idx);
  }

  _calculateAnchor(lower: number, upper: number): number {
    if (lower <= 0) {
      return 0;
    }
    if (upper > this._virtualizerSize - this._viewDim1) {
      return this.items.length - 1;
    }
    return Math.max(
      0,
      Math.min(
        this.items.length - 1,
        Math.floor((lower + upper) / 2 / this._delta)
      )
    );
  }

  _getAnchor(lower: number, upper: number): number {
    if (this._physicalItems.size === 0) {
      return this._calculateAnchor(lower, upper);
    }
    if (this._first < 0) {
      return this._calculateAnchor(lower, upper);
    }
    if (this._last < 0) {
      return this._calculateAnchor(lower, upper);
    }
    if (this._last > this.items.length - 1) {
      return this._calculateAnchor(lower, upper);
    }

    const firstItem = this._getPhysicalItem(this._first),
      lastItem = this._getPhysicalItem(this._last),
      firstMin = firstItem!.pos,
      lastMin = lastItem!.pos,
      lastMax = lastMin + lastItem!.size;

    if (lastMax < lower) {
      // Window is entirely past physical items, calculate new anchor
      return this._calculateAnchor(lower, upper);
    }
    if (firstMin > upper) {
      // Window is entirely before physical items, calculate new anchor
      return this._calculateAnchor(lower, upper);
    }
    // Window contains a physical item
    // Find one, starting with the one that was previously first visible
    let candidateIdx = this._firstVisible - 1;
    let cMax = -Infinity;
    while (cMax < lower) {
      const candidate = this._getPhysicalItem(++candidateIdx);
      cMax = candidate!.pos + this._metricsCache.getChildSize(candidateIdx)!;
    }
    return candidateIdx;
  }

  /**
   * Updates _first and _last based on items that should be in the current
   * viewed range.
   */
  _getActiveItems() {
    if (this._viewDim1 === 0 || this.items.length === 0) {
      this._clearItems();
    } else {
      this._getItems();
      this._refineScrollSize();
    }
  }

  /**
   * Sets the range to empty.
   */
  _clearItems() {
    this._first = -1;
    this._last = -1;
    this._physicalMin = 0;
    this._physicalMax = 0;
    const items = this._newPhysicalItems;
    this._newPhysicalItems = this._physicalItems;
    this._newPhysicalItems.clear();
    this._physicalItems = items;
    this._stable = true;
  }

  /*
   * Updates _first and _last based on items that should be in the given range.
   */
  _getItems() {
    const items = this._newPhysicalItems;
    this._stable = true;
    let lower, upper;

    // The anchorIdx is the anchor around which we reflow. It is designed to
    // allow jumping to any point of the scroll size. We choose it once and
    // stick with it until stable. first and last are deduced around it.

    // If we have a pinned item, we anchor on it
    if (this.pin !== null) {
      const {index} = this.pin;
      this._anchorIdx = index;
      this._anchorPos = this._getPosition(index);
    }

    // Determine the lower and upper bounds of the region to be
    // rendered, relative to the viewport
    lower = this._blockScrollPosition - this._overhang;
    upper = this._blockScrollPosition + this._viewDim1 + this._overhang;

    if (upper < 0 || lower > this._virtualizerSize) {
      this._clearItems();
      return;
    }

    // If we are scrolling to a specific index or if we are doing another
    // pass to stabilize a previously started reflow, we will already
    // have an anchor. If not, establish an anchor now. Also recalculate
    // if the existing anchor is completely outside the viewport bounds
    // (e.g. after a large scroll jump where the update cycle was frozen).
    if (
      this._anchorIdx === null ||
      this._anchorPos === null ||
      this._anchorPos > upper ||
      this._anchorPos < lower
    ) {
      this._anchorIdx = this._getAnchor(lower, upper);
      this._anchorPos = this._getPosition(this._anchorIdx);
    }

    let anchorSize = this._getSize(this._anchorIdx);
    if (anchorSize === undefined) {
      this._stable = false;
      anchorSize = this._getAverageSize();
    }

    const anchorLeadingMargin =
      this._metricsCache.getMarginSize(this._anchorIdx) ??
      this._metricsCache.averageMarginSize;
    const anchorTrailingMargin =
      this._metricsCache.getMarginSize(this._anchorIdx + 1) ??
      this._metricsCache.averageMarginSize;

    if (this._anchorIdx === 0) {
      this._anchorPos = anchorLeadingMargin;
    }

    if (this._anchorIdx === this.items.length - 1) {
      this._anchorPos =
        this._virtualizerSize - anchorTrailingMargin - anchorSize;
    }

    // Anchor might be outside bounds, so prefer correcting the error and keep
    // that anchorIdx.
    let anchorErr = 0;

    if (this._anchorPos + anchorSize + anchorTrailingMargin < lower) {
      anchorErr = lower - (this._anchorPos + anchorSize + anchorTrailingMargin);
    }

    if (this._anchorPos - anchorLeadingMargin > upper) {
      anchorErr = upper - (this._anchorPos - anchorLeadingMargin);
    }

    if (anchorErr) {
      this._blockScrollPosition -= anchorErr;
      lower -= anchorErr;
      upper -= anchorErr;
      this._scrollError += anchorErr;
    }

    items.set(this._anchorIdx, {pos: this._anchorPos, size: anchorSize});

    this._first = this._last = this._anchorIdx;
    this._physicalMin = this._anchorPos - anchorLeadingMargin;
    this._physicalMax = this._anchorPos + anchorSize + anchorTrailingMargin;

    while (this._physicalMin > lower && this._first > 0) {
      let size = this._getSize(--this._first);
      if (size === undefined) {
        this._stable = false;
        size = this._getAverageSize();
      }
      let margin = this._metricsCache.getMarginSize(this._first);
      if (margin === undefined) {
        this._stable = false;
        margin = this._metricsCache.averageMarginSize;
      }
      this._physicalMin -= size;
      const pos = this._physicalMin;
      items.set(this._first, {pos, size});
      this._physicalMin -= margin;
      if (this._stable === false && this._estimate === false) {
        break;
      }
    }

    while (this._physicalMax < upper && this._last < this.items.length - 1) {
      let size = this._getSize(++this._last);
      if (size === undefined) {
        this._stable = false;
        size = this._getAverageSize();
      }
      if (this._metricsCache.getMarginSize(this._last) === undefined) {
        this._stable = false;
      }
      let trailingMargin = this._metricsCache.getMarginSize(this._last + 1);
      if (trailingMargin === undefined) {
        this._stable = false;
        trailingMargin = this._metricsCache.averageMarginSize;
      }
      const pos = this._physicalMax;
      items.set(this._last, {pos, size});
      this._physicalMax += size + trailingMargin;
      if (!this._stable && !this._estimate) {
        break;
      }
    }

    // This handles the cases where we were relying on estimated sizes.
    const extentErr = this._calculateError();
    if (extentErr) {
      this._physicalMin -= extentErr;
      this._physicalMax -= extentErr;
      this._anchorPos -= extentErr;
      this._blockScrollPosition -= extentErr;
      items.forEach((item) => (item.pos -= extentErr));
      this._scrollError += extentErr;
    }

    if (this._stable) {
      this._newPhysicalItems = this._physicalItems;
      this._newPhysicalItems.clear();
      this._physicalItems = items;
    }
  }

  _calculateError(): number {
    if (this._first === 0) {
      return this._physicalMin;
    } else if (this._physicalMin <= 0) {
      return this._physicalMin - this._first * this._delta;
    } else if (this._last === this.items.length - 1) {
      return this._physicalMax - this._virtualizerSize;
    } else if (this._physicalMax >= this._virtualizerSize) {
      return (
        this._physicalMax -
        this._virtualizerSize +
        (this.items.length - 1 - this._last) * this._delta
      );
    }
    return 0;
  }

  override _reflow() {
    const {_first, _last} = this;
    super._reflow();
    if (
      (this._first === -1 && this._last == -1) ||
      (this._first === _first && this._last === _last)
    ) {
      this._resetReflowState();
    }
  }

  _resetReflowState() {
    // Don't clear _anchorIdx / _anchorPos here. The anchor persists
    // across reflows so that measurements can settle around it without
    // triggering cascading scroll corrections. The bounds check in
    // _getItems will lazily recalculate the anchor when the viewport
    // moves far enough that the anchor is no longer in view.
    this._stable = true;
  }

  _updateVirtualizerSize() {
    const {averageMarginSize} = this._metricsCache;
    this._virtualizerSize =
      this.items.length * (averageMarginSize + this._getAverageSize()) +
      averageMarginSize;
    if (this._pendingScrollCorrection !== null) {
      const oldSize = this._pendingScrollCorrection;
      const newSize = this._virtualizerSize;
      if (oldSize > 0 && Math.abs(newSize - oldSize) > 1) {
        const ratio = newSize / oldSize;
        const scrollAdjustment = this._blockScrollPosition * (ratio - 1);
        this._blockScrollPosition *= ratio;
        this._scrollError -= scrollAdjustment;
        for (const item of this._physicalItems.values()) {
          item.pos *= ratio;
        }
        if (this._anchorPos !== null) {
          this._anchorPos *= ratio;
        }
        this._physicalMin *= ratio;
        this._physicalMax *= ratio;
        this._pendingScrollCorrection = null;
      }
    }
  }

  _refineScrollSize() {
    // If all items are rendered, we can calculate the scroll size exactly
    if (this._first === 0 && this._last === this.items.length - 1) {
      this._virtualizerSize = this._physicalMax - this._physicalMin;
    }
    // Otherwise, we re-estimate with latest measurements
    else {
      this._updateVirtualizerSize();
    }
  }

  /**
   * Returns the average size (precise or estimated) of an item in the scrolling direction,
   * including any surrounding space.
   */
  protected get _delta(): number {
    const {averageMarginSize} = this._metricsCache;
    return this._getAverageSize() + averageMarginSize;
  }

  /**
   * Returns the top and left positioning of the item at idx.
   */
  _getItemPosition(idx: number): Positions {
    const marginOffset =
      this._metricsCache.getLeadingMarginValue(idx) ??
      this._metricsCache.averageMarginSize;
    return {
      insetBlockStart: this._getPosition(idx) - marginOffset,
      insetInlineStart: 0,
    } as Positions;
  }

  /**
   * Override to use visual (border-edge) positions for scroll targeting.
   * The base implementation uses _getItemPosition, which in Flow returns
   * the transform position (offset by marginBlockStart for absolute
   * positioning). For scroll-to, we need the visual position where the
   * item's border box actually appears.
   */
  protected _calculateScrollIntoViewPosition(options: PinOptions) {
    const {block} = options;
    const index = Math.min(this.items.length, Math.max(0, options.index));
    const itemStartPosition = this._getPosition(index);
    let scrollPosition = itemStartPosition;
    if (block !== 'start') {
      const itemSize = this._getItemSize(index).blockSize;
      if (block === 'center') {
        scrollPosition =
          itemStartPosition - 0.5 * this._viewDim1 + 0.5 * itemSize;
      } else {
        const itemEndPosition = itemStartPosition - this._viewDim1 + itemSize;
        if (block === 'end') {
          scrollPosition = itemEndPosition;
        } else {
          // block === 'nearest'
          const currentScrollPosition = this._blockScrollPosition;
          scrollPosition =
            Math.abs(currentScrollPosition - itemStartPosition) <
            Math.abs(currentScrollPosition - itemEndPosition)
              ? itemStartPosition
              : itemEndPosition;
        }
      }
    }
    scrollPosition += this.offsetWithinScroller.block;
    return this._clampScrollPosition(scrollPosition);
  }

  /**
   * Returns the height and width of the item at idx.
   */
  _getItemSize(idx: number): LogicalSize {
    return {
      blockSize: this._getSize(idx) || this._getAverageSize(),
      inlineSize: this._itemSize.inlineSize,
    } as LogicalSize;
  }
}
