/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LayoutHostSink, LogicalSize, Positions} from './shared/Layout.js';
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

  protected _getItemSize(_idx: number): LogicalSize {
    return {
      blockSize: this._metrics!.itemSize1,
      inlineSize: this._metrics!.itemSize2,
    };
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
      const min = Math.max(0, this._blockScrollPosition - this._overhang);
      const max = Math.min(
        this._virtualizerSize,
        this._blockScrollPosition + this._viewDim1 + this._overhang
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
      this._physicalMin =
        (firstCow > 0 ? padding1.start : 0) + this._delta * firstCow;
      this._physicalMax = padding1.start + this._delta * lastCow;
    }
  }

  _getItemPosition(idx: number): Positions {
    const {rolumns, padding1, positions, itemSize1, itemSize2} = this._metrics!;
    return {
      insetBlockStart: padding1.start + Math.floor(idx / rolumns) * this._delta,
      insetInlineStart: positions[idx % rolumns],
      blockSize: itemSize1,
      inlineSize: itemSize2,
    };
  }

  _updateVirtualizerSize() {
    const {rolumns, gap1, padding1, itemSize1} = this._metrics!;
    let size = 1;
    if (rolumns > 0) {
      const cows = Math.ceil(this.items.length / rolumns);
      size =
        padding1.start + cows * itemSize1 + (cows - 1) * gap1 + padding1.end;
    }
    this._virtualizerSize = size;
  }
}
