/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  LayoutHostSink,
  Positions,
  LogicalSize,
  // FixedSize,
  // writingMode,
  // EditElementLayoutInfoFunction,
  ElementLayoutInfo,
  EditElementLayoutInfoFunctionOptions,
  // ChildLayoutInfo
} from './shared/Layout.js';
import {GridBaseLayout, GridBaseLayoutConfig} from './shared/GridBaseLayout.js';
import {PixelSize} from './shared/SizeGapPaddingBaseLayout.js';

type GetAspectRatioFromItem = (item: unknown) => number;
type GetAspectRatioFromElement = (
  element: Element,
  requestReflow: () => void
) => number;

export interface MasonryLayoutConfig
  extends Omit<GridBaseLayoutConfig, 'flex' | 'itemSize'> {
  flex: boolean;
  itemSize: PixelSize;
  getAspectRatioFromItem?: GetAspectRatioFromItem;
  getAspectRatioFromElement?: GetAspectRatioFromElement;
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
type ElementLayoutInfoWithAspectRatio = ElementLayoutInfo & {
  aspectRatio: number;
};
type ChildLayoutInfoWithAspectRatio = Map<
  number,
  ElementLayoutInfoWithAspectRatio
>;

const MIN = 'MIN';
const MAX = 'MAX';
type MinOrMax = 'MIN' | 'MAX';

export class MasonryLayout extends GridBaseLayout<MasonryLayoutConfig> {
  private _RANGE_MAP_GRANULARITY = 100;
  private _childLayoutInfo: ChildLayoutInfoWithAspectRatio = new Map();
  private _positions: Map<number, Positions> = new Map();
  private _rangeMap: Map<number, RangeMapEntry> = new Map();
  private _getAspectRatioFromItem?: GetAspectRatioFromItem;
  private _getAspectRatioFromElement?: GetAspectRatioFromElement;

  protected get _defaultConfig(): MasonryLayoutConfig {
    return Object.assign({}, super._defaultConfig, {
      // getAspectRatio: () => 1,
    });
  }

  set getAspectRatioFromItem(getAspectRatioFromItem: GetAspectRatioFromItem) {
    this._getAspectRatioFromItem = getAspectRatioFromItem;
  }

  set getAspectRatioFromElement(
    getAspectRatioFromElement: GetAspectRatioFromElement
  ) {
    this._getAspectRatioFromElement = getAspectRatioFromElement;
  }

  set items(items: unknown[]) {
    if (items !== this._items) {
      this._scheduleLayoutUpdate();
    }
    super.items = items;
  }
  get items() {
    return super.items;
  }

  protected _getItemSize(_idx: number): LogicalSize {
    return {
      blockSize: this._metrics!.itemSize1,
      inlineSize: this._metrics!.itemSize2,
    } as unknown as LogicalSize;
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
    let virtualizerSize = 0;
    let minRangeMapKey = Infinity;
    let maxRangeMapKey = -Infinity;
    this.items.forEach((item, idx) => {
      const aspectRatio = this._getAspectRatioFromItem
        ? this._getAspectRatioFromItem(item)
        : this._childLayoutInfo.get(idx)
        ? this._childLayoutInfo.get(idx)!.aspectRatio
        : 1;
      const size1 = itemSize2 / aspectRatio;
      const pos1 = nextPosPerRolumn[nextRolumn];
      const pos2 = positions[nextRolumn];
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
    const {rolumns} = metrics;
    if (rolumns === 0 || this._rangeMap.size === 0) {
      this._first = -1;
      this._last = -1;
      this._physicalMin = 0;
      this._physicalMax = 0;
    } else {
      const min = Math.max(0, this._blockScrollPosition - this._overhang);
      const max = Math.min(
        this._virtualizerSize,
        this._blockScrollPosition + this._viewDim1 + this._overhang
      );
      const maxIdx = this.items.length - 1;
      const minRange = this._rangeMap.get(this._getRangeMapKey(min, MIN)) ?? [
        0, 0,
      ];
      const maxRange = this._rangeMap.get(this._getRangeMapKey(max, MAX)) ?? [
        maxIdx,
        maxIdx,
      ];
      this._first = Math.min(minRange[0], maxRange[0]);
      this._last = Math.max(minRange[1], maxRange[1]);
    }
  }

  _getItemPosition(idx: number): Positions {
    return this._positions.get(idx)!;
  }

  _updateVirtualizerSize() {
    // We calculate _virtualizerSize in _layouOutChildren(),
    // no need to do it here
  }

  editElementLayoutInfo(options: EditElementLayoutInfoFunctionOptions) {
    const {baselineInfo, element} = options;
    if (this._getAspectRatioFromElement) {
      const triggerReflow = () => this._triggerReflow();
      return {
        ...baselineInfo,
        aspectRatio: this._getAspectRatioFromElement(element, triggerReflow),
      };
    } else {
      return baselineInfo;
    }
  }

  updateItemSizes(childLayoutInfo: ChildLayoutInfoWithAspectRatio) {
    childLayoutInfo.forEach((info, idx) => {
      if (info.aspectRatio !== -1) {
        this._childLayoutInfo.set(idx, info);
      }
    });
    this._scheduleLayoutUpdate();
  }
}
