/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LayoutHostSink, Positions, Size} from './shared/Layout.js';
import {GridBaseLayout, GridBaseLayoutConfig} from './shared/GridBaseLayout.js';
import {PixelSize} from './shared/SizeGapPaddingBaseLayout.js';

type GetAspectRatio = (item: unknown) => number;

export interface MasonryLayoutConfig
  extends Omit<GridBaseLayoutConfig, 'flex' | 'itemSize'> {
  flex: boolean;
  itemSize: PixelSize;
  getAspectRatio: GetAspectRatio;
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

type RangeMapEntry = [number, number];

const MIN = 'MIN';
const MAX = 'MAX';
type MinOrMax = 'MIN' | 'MAX';

export class MasonryLayout extends GridBaseLayout<MasonryLayoutConfig> {
  private _RANGE_MAP_GRANULARITY = 100;
  private _positions = new Map<number, Positions>();
  private _rangeMap = new Map<number, RangeMapEntry>();
  private _getAspectRatio?: GetAspectRatio;

  protected _getDefaultConfig(): MasonryLayoutConfig {
    return Object.assign({}, super._getDefaultConfig(), {
      getAspectRatio: () => 1,
    });
  }

  set getAspectRatio(getAspectRatio: GetAspectRatio) {
    this._getAspectRatio = getAspectRatio;
  }

  protected _setItems(items: unknown[]) {
    if (items !== this._items) {
      this._scheduleLayoutUpdate();
    }
    super._setItems(items);
  }

  protected _getItemSize(_idx: number): Size {
    return {
      [this._sizeDim]: this._metrics!.itemSize1,
      [this._secondarySizeDim]: this._metrics!.itemSize2,
    } as unknown as Size;
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
    const {rolumns, padding1, itemSize2, gap1, positions} = this._metrics!;
    let nextPos = padding1.start;
    const nextPosPerRolumn = new Array(rolumns).fill(null).map((_) => nextPos);
    let nextRolumn = 0;
    let scrollSize = 0;
    let minRangeMapKey = Infinity;
    let maxRangeMapKey = -Infinity;
    this.items.forEach((item, idx) => {
      const aspectRatio = this._getAspectRatio!(item as {integer: number});
      const size1 =
        this.direction === 'horizontal'
          ? itemSize2 * aspectRatio
          : itemSize2 / aspectRatio;
      const pos1 = nextPosPerRolumn[nextRolumn];
      const pos2 = positions[nextRolumn];
      this._positions.set(idx, {
        [this._positionDim]: pos1,
        [this._secondaryPositionDim]: pos2,
        [this._sizeDim]: size1,
        [this._secondarySizeDim]: itemSize2,
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
        const [minIdx, maxIdx] = this._rangeMap.get(n) ?? [Infinity, -Infinity];
        this._rangeMap.set(n, [Math.min(idx, minIdx), Math.max(idx, maxIdx)]);
      }
      scrollSize = Math.max(scrollSize, max1 + padding1.end);
      nextPosPerRolumn[nextRolumn] += size1 + gap1;
      nextPos = Infinity;
      nextPosPerRolumn.forEach((pos, rolumn) => {
        if (pos < nextPos) {
          nextPos = pos;
          nextRolumn = rolumn;
        }
      });
    });
    if (minRangeMapKey !== Infinity) {
      for (let n = 0; n < minRangeMapKey; n += G) {
        this._rangeMap.set(n, [-1, -1]);
      }
    }
    if (maxRangeMapKey !== -Infinity) {
      const maxRange = this._rangeMap.get(maxRangeMapKey)!;
      for (let n = maxRangeMapKey + G; n < scrollSize + G; n += G) {
        this._rangeMap.set(n, maxRange);
      }
    }
    this._scrollSize = scrollSize;
  }

  _getActiveItems() {
    const metrics = this._metrics!;
    const {rolumns} = metrics;
    if (rolumns === 0 || this._rangeMap.size === 0) {
      this._first = -1;
      this._last = -1;
      this._physicalMin = 0;
      this._physicalMax = 0;
    } else {
      const min = Math.max(0, this._scrollPosition - this._overhang);
      const max = Math.min(
        this._scrollSize,
        this._scrollPosition + this._viewDim1 + this._overhang
      );
      const maxIdx = this.items.length - 1;
      const minKey = this._getRangeMapKey(min, MIN);
      const maxKey = this._getRangeMapKey(max, MAX);
      let first = maxIdx;
      let last = 0;
      for (let n = minKey; n <= maxKey; n += this._RANGE_MAP_GRANULARITY) {
        const [rangeFirst, rangeLast] = this._rangeMap.get(n) ?? [maxIdx, 0];
        first = Math.min(first, rangeFirst);
        last = Math.max(last, rangeLast);
      }
      this._first = first;
      this._last = last;
    }
  }

  _getItemPosition(idx: number): Positions {
    return this._positions.get(idx)!;
  }

  _updateScrollSize() {
    // We calculate scrollSize in _layouOutChildren(),
    // no need to do it here
  }
}
