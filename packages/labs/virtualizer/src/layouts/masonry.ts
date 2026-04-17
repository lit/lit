/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LayoutHostSink, Positions, LogicalSize} from './shared/Layout.js';
import {GridBaseLayout, GridBaseLayoutConfig} from './shared/GridBaseLayout.js';
import {PixelSize} from './shared/SizeGapPaddingBaseLayout.js';

type GetAspectRatio = (item: unknown) => number;

export interface MasonryLayoutConfig
  extends Omit<GridBaseLayoutConfig, 'flex' | 'itemSize'> {
  flex: boolean;
  itemSize: PixelSize;
  /**
   * Returns the aspect ratio of a given item, interpreted as **visual
   * `width / height`** — appropriate for images, photos, and other
   * content whose dimensions are intrinsic and independent of CSS
   * writing-mode. The layout preserves this visual ratio across all
   * writing-modes and axis configurations.
   *
   * Flow-like content (e.g. text cards whose shape depends on the
   * writing-mode) is not served well by this semantic; a follow-up
   * API for logical (inlineSize / blockSize) aspect ratios is planned.
   * See https://github.com/lit/lit/issues/5308.
   */
  getAspectRatio?: GetAspectRatio;
}

type MasonryLayoutSpecifier = MasonryLayoutConfig & {
  type: new (
    hostSink: LayoutHostSink,
    config?: MasonryLayoutConfig
  ) => MasonryLayout;
};

type MasonryLayoutSpecifierFactory = (
  config?: MasonryLayoutConfig
) => MasonryLayoutSpecifier;

export const masonry: MasonryLayoutSpecifierFactory = (
  config?: MasonryLayoutConfig
) =>
  Object.assign(
    {
      type: MasonryLayout,
    },
    config
  );

type RangeMapEntry = [number, number, number, number];

const MIN = 'MIN';
const MAX = 'MAX';
type MinOrMax = 'MIN' | 'MAX';

export class MasonryLayout extends GridBaseLayout<MasonryLayoutConfig> {
  private _RANGE_MAP_GRANULARITY = 100;
  private _positions = new Map<number, Positions>();
  private _rangeMap = new Map<number, RangeMapEntry>();
  private _getAspectRatio?: GetAspectRatio;

  set getAspectRatio(getAspectRatio: GetAspectRatio) {
    this._getAspectRatio = getAspectRatio;
  }

  protected _setItems(items: unknown[]) {
    if (items !== this._items) {
      this._scheduleLayoutUpdate();
    }
    super._setItems(items);
  }

  protected _getItemSize(_idx: number): LogicalSize {
    return {
      blockSize: this._metrics!.itemSize1,
      inlineSize: this._metrics!.itemSize2,
    };
  }

  protected _updateLayout() {
    super._updateLayout();
    // Possibly, we want to do this somewhere else instead
    this._layOutChildren();
  }

  private _getRangeMapKey(scrollPos: number, minOrMax: MinOrMax) {
    const G = this._RANGE_MAP_GRANULARITY;
    return minOrMax === MIN
      ? Math.floor(scrollPos / G) * G
      : Math.ceil(scrollPos / G) * G;
  }

  private _layOutChildren() {
    const G = this._RANGE_MAP_GRANULARITY;
    this._positions.clear();
    this._rangeMap.clear();
    const {columns, padding1, itemSize2, gap1, positions} = this._metrics!;
    let nextPos = padding1.start;
    const nextPosPerColumn = new Array(columns).fill(null).map((_) => nextPos);
    let nextColumn = 0;
    let virtualizerSize = 0;
    let minRangeMapKey = Infinity;
    let maxRangeMapKey = -Infinity;
    // `aspectRatio` is defined as visual `width / height` — independent
    // of writing-mode. Branching here converts that visual ratio into a
    // block-axis size given the cross-axis size (`itemSize2`). When the
    // layout's block axis is visually horizontal (vertical writing-modes,
    // or axis='inline' after the virtualizer's own writing-mode swap),
    // `blockSize = itemSize2 * aspectRatio`; otherwise
    // `blockSize = itemSize2 / aspectRatio`.
    const blockIsVisuallyHorizontal = this.writingMode !== 'horizontal-tb';
    this.items.forEach((item, idx) => {
      const aspectRatio = this._getAspectRatio ? this._getAspectRatio(item) : 1;
      const size1 = blockIsVisuallyHorizontal
        ? itemSize2 * aspectRatio
        : itemSize2 / aspectRatio;
      const pos1 = nextPosPerColumn[nextColumn];
      const pos2 = positions[nextColumn];
      this._positions.set(idx, {
        insetBlockStart: pos1,
        insetInlineStart: pos2,
        blockSize: size1,
        inlineSize: itemSize2,
      } as Positions);
      const max1 = pos1 + size1;
      const firstRangeMapKey = this._getRangeMapKey(pos1, MIN);
      if (firstRangeMapKey < minRangeMapKey) {
        minRangeMapKey = firstRangeMapKey;
      }
      const lastRangeMapKey = this._getRangeMapKey(max1, MAX);
      if (lastRangeMapKey > maxRangeMapKey) {
        maxRangeMapKey = lastRangeMapKey;
      }
      for (let n = firstRangeMapKey; n <= lastRangeMapKey; n += G) {
        const [minIdx, maxIdx, minExtent, maxExtent] = this._rangeMap.get(
          n
        ) ?? [Infinity, -Infinity, Infinity, -Infinity];
        this._rangeMap.set(n, [
          Math.min(idx, minIdx),
          Math.max(idx, maxIdx),
          Math.min(pos1, minExtent),
          Math.max(max1, maxExtent),
        ]);
      }
      virtualizerSize = Math.max(virtualizerSize, max1 + padding1.end);
      nextPosPerColumn[nextColumn] += size1 + gap1;
      nextPos = Infinity;
      nextPosPerColumn.forEach((pos, column) => {
        if (pos < nextPos) {
          nextPos = pos;
          nextColumn = column;
        }
      });
    });
    if (minRangeMapKey !== Infinity) {
      for (let n = 0; n < minRangeMapKey; n += G) {
        this._rangeMap.set(n, [-1, -1, 0, 0]);
      }
    }
    if (maxRangeMapKey !== -Infinity) {
      const maxRange = this._rangeMap.get(maxRangeMapKey)!;
      for (let n = maxRangeMapKey + G; n < virtualizerSize + G; n += G) {
        this._rangeMap.set(n, maxRange);
      }
    }
    this._virtualizerSize = virtualizerSize;
  }

  _getActiveItems() {
    const metrics = this._metrics!;
    const {columns} = metrics;
    if (columns === 0 || this._rangeMap.size === 0) {
      this._first = -1;
      this._last = -1;
      this._physicalMin = 0;
      this._physicalMax = 0;
    } else {
      const min = Math.max(0, this._blockScrollPosition - this._overscanPx);
      const max = Math.min(
        this._virtualizerSize,
        this._blockScrollPosition + this._viewDim1 + this._overscanPx
      );
      const minKey = this._getRangeMapKey(min, MIN);
      const maxKey = this._getRangeMapKey(max, MAX);
      const maxIdx = this.items.length - 1;
      let first = maxIdx;
      let last = 0;
      let physicalMin = Infinity;
      let physicalMax = -Infinity;
      for (let n = minKey; n <= maxKey; n += this._RANGE_MAP_GRANULARITY) {
        const entry = this._rangeMap.get(n);
        if (entry) {
          const [rangeFirst, rangeLast, rangeMin, rangeMax] = entry;
          first = Math.min(first, rangeFirst);
          last = Math.max(last, rangeLast);
          physicalMin = Math.min(physicalMin, rangeMin);
          physicalMax = Math.max(physicalMax, rangeMax);
        }
      }
      if (first <= last) {
        this._first = first;
        this._physicalMin = this._first === 0 ? 0 : physicalMin;
        this._last = last;
        this._physicalMax = physicalMax;
      } else {
        throw new Error(
          'Masonry layout error: no layout info for current scroll coordinates'
        );
      }
    }
  }

  _getItemPosition(idx: number): Positions {
    return this._positions.get(idx)!;
  }

  _updateVirtualizerSize() {
    // We calculate _virtualizerSize in _layouOutChildren(),
    // no need to do it here
  }
}
