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
    const {columns} = metrics;
    if (columns === 0) {
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
      const firstRow = Math.max(
        0,
        Math.floor((min - padding1.start) / this._delta)
      );
      const lastRow = Math.max(
        0,
        Math.ceil((max - padding1.start) / this._delta)
      );

      this._first = firstRow * columns;
      this._last = Math.min(lastRow * columns - 1, this.items.length - 1);
      this._physicalMin =
        (firstRow > 0 ? padding1.start : 0) + this._delta * firstRow;
      this._physicalMax = padding1.start + this._delta * lastRow;
    }
  }

  _getItemPosition(idx: number): Positions {
    const {columns, padding1, positions, itemSize1, itemSize2} = this._metrics!;
    return {
      insetBlockStart: padding1.start + Math.floor(idx / columns) * this._delta,
      insetInlineStart: positions[idx % columns],
      blockSize: itemSize1,
      inlineSize: itemSize2,
    };
  }

  _updateVirtualizerSize() {
    const {columns, gap1, padding1, itemSize1} = this._metrics!;
    let size = 1;
    if (columns > 0) {
      const rows = Math.ceil(this.items.length / columns);
      size =
        padding1.start + rows * itemSize1 + (rows - 1) * gap1 + padding1.end;
    }
    this._virtualizerSize = size;
  }
}
