/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LayoutHostSink, Positions, Size} from './shared/Layout.js';
import {dim1, dim2} from './shared/BaseLayout.js';
import {GridBaseLayout, GridBaseLayoutConfig} from './shared/GridBaseLayout.js';

type GridLayoutSpecifier = GridBaseLayoutConfig & {
  type: new (
    hostSink: LayoutHostSink,
    config?: GridBaseLayoutConfig
  ) => GridLayout;
};

type GridLayoutSpecifierFactory = (
  config?: GridBaseLayoutConfig
) => GridLayoutSpecifier;

export const grid: GridLayoutSpecifierFactory = (
  config?: GridBaseLayoutConfig
) =>
  Object.assign(
    {
      type: GridLayout,
    },
    config
  );

export class GridLayout extends GridBaseLayout<GridBaseLayoutConfig> {
  /**
   * Returns the average size (precise or estimated) of an item in the scrolling direction,
   * including any surrounding space.
   */
  protected get _delta() {
    return this._metrics!.itemSize1 + this._metrics!.gap1;
  }

  protected _getItemSize(_idx: number): Size {
    return {
      [this._sizeDim]: this._metrics!.itemSize1,
      [this._secondarySizeDim]: this._metrics!.itemSize2,
    } as unknown as Size;
  }

  _getActiveItems() {
    const metrics = this._metrics!;
    const {rolumns} = metrics;
    if (rolumns === 0) {
      this._first = -1;
      this._last = -1;
      this._physicalMin = 0;
      this._physicalMax = 0;
    } else {
      const {padding1} = metrics;
      const min = Math.max(0, this._scrollPosition - this._overhang);
      const max = Math.min(
        this._scrollSize,
        this._scrollPosition + this._viewDim1 + this._overhang
      );
      const firstCow = Math.max(
        0,
        Math.floor((min - padding1.start) / this._delta)
      );
      const lastCow = Math.max(
        0,
        Math.ceil((max - padding1.start) / this._delta)
      );

      this._first = firstCow * rolumns;
      this._last = Math.min(lastCow * rolumns - 1, this.items.length - 1);
      this._physicalMin = padding1.start + this._delta * firstCow;
      this._physicalMax = padding1.start + this._delta * lastCow;
    }
  }

  _getItemPosition(idx: number): Positions {
    const {rolumns, padding1, positions, itemSize1, itemSize2} = this._metrics!;
    return {
      [this._positionDim]:
        padding1.start + Math.floor(idx / rolumns) * this._delta,
      [this._secondaryPositionDim]: positions[idx % rolumns],
      [dim1(this.direction)]: itemSize1,
      [dim2(this.direction)]: itemSize2,
    } as unknown as {top: number; left: number};
  }

  _updateScrollSize() {
    const {rolumns, gap1, padding1, itemSize1} = this._metrics!;
    let size = 1;
    if (rolumns > 0) {
      const cows = Math.ceil(this.items.length / rolumns);
      size =
        padding1.start + cows * itemSize1 + (cows - 1) * gap1 + padding1.end;
    }
    this._scrollSize = size;
  }
}
