/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { SizeGapPaddingBaseLayout, SizeGapPaddingBaseLayoutConfig, AutoGapSpec, gap2 as gap2Name } from './shared/SizeGapPaddingBaseLayout.js';
import {Positions, Size} from './shared/Layout.js';
import { dim1, dim2 } from './shared/BaseLayout.js';

type FlexSpec = boolean | { preserve: 'aspect-ratio' | 'area' | 'width' | 'height' };
type JustifySpec = 'start' | 'center' | 'end' | 'space-evenly' | 'space-around' | 'space-between';

interface GridLayoutConfig extends Omit<SizeGapPaddingBaseLayoutConfig, 'gap'> {
  gap?: AutoGapSpec,
  flex?: FlexSpec
  justify?: JustifySpec
}

type GridLayoutSpecifier = GridLayoutConfig & {
  type: new(config?: GridLayoutConfig) => GridLayout
}

type GridLayoutSpecifierFactory = (config?: GridLayoutConfig) => GridLayoutSpecifier;

export const grid: GridLayoutSpecifierFactory = (config?: GridLayoutConfig) => Object.assign({
  type: GridLayout
}, config);

interface GridLayoutMetrics {
  rolumns: number,
  itemSize1: number,
  itemSize2: number,
  gap1: number,
  gap2: number,
  padding1: {
    start: number,
    end: number
  },
  padding2: {
    start: number,
    end: number
  },
  positions: number[]
}

///

export class GridLayout extends SizeGapPaddingBaseLayout<GridLayoutConfig> {
  /**
   * Initial estimate of item size
   */
  // protected _rolumns: number = 1;
  // protected _size1: number | null = null;
  // protected _size2: number | null = null;
  protected _metrics: GridLayoutMetrics | null = null;
  flex: FlexSpec | null = null;
  justify: JustifySpec | null = null;

  protected get _defaultConfig(): GridLayoutConfig {
    return Object.assign({}, super._defaultConfig, {
      flex: false,
      justify: 'start'
    });
  }

  set gap(spec: AutoGapSpec) {
    this._setGap(spec);
  }

  _updateLayout() {
    const justify = this.justify as JustifySpec;
    const [ padding1Start, padding1End ] = this._padding1;
    const [ padding2Start, padding2End ] = this._padding2;

    // TODO (graynorton): Omit these checks in production mode
    ['_gap1', '_gap2'].forEach(gap => {
      const gapValue = this[gap as '_gap1' | '_gap2'];
      if (gapValue === Infinity && !(['space-between', 'space-around', 'space-evenly'].includes(justify))) {
        throw new Error(`grid layout: gap can only be set to 'auto' when justify is set to 'space-between', 'space-around' or 'space-evenly'`);
      }
      if (gapValue === Infinity && gap === '_gap2') {
        throw new Error(`grid layout: ${gap2Name(this.direction)}-gap cannot be set to 'auto' when direction is set to ${this.direction}`);
      }
    });

    const metrics: GridLayoutMetrics = {
      rolumns: -1,
      itemSize1: -1,
      itemSize2: -1,
      // Infinity represents 'auto', so we set an invalid placeholder until we can calculate
      gap1: this._gap1 === Infinity ? -1 : this._gap1,
      gap2: this._gap2,
      // Infinity represents 'match-gap', so we set padding to match gap
      padding1: {
        start: padding1Start === Infinity ? this._gap1 : padding1Start,
        end: padding1End === Infinity ? this._gap1 : padding1End
      },
      padding2: {
        start: padding2Start === Infinity ? this._gap2 : padding2Start,
        end: padding2End === Infinity ? this._gap2 : padding2End
      },
      positions: []
    };

    let availableSpace = this._viewDim2;
    // 1. Adjust available space to account for gaps and padding
    if (this.flex || [ 'start', 'center', 'end' ].includes(justify)) {
      // If we're flexing item size or packing items around start / center / end,
      // we'll use the specified padding, so we subtract padding from available space
      availableSpace -= metrics.padding2.start;
      availableSpace -= metrics.padding2.end;
    }
    else if (justify === 'space-between') {
      // 'space-between' packs items right up to the edges, so we have more space to work with
      availableSpace += metrics.gap2;
    }
    else if (justify === 'space-evenly') {
      // 'space-evenly' requires a full share of space on the outside edges, so we have less space to work with
      availableSpace -= metrics.gap2;
    }
    // 2. Calculate roughly how many "rolumns" fit in the available space
    const spacePerRolumn = this._idealSize2 + metrics.gap2;
    const fractionalRolumns = availableSpace / spacePerRolumn;
    // 3. Calculate item size (if we're flexing) and finalize the number of rolumns accordingly
    if (this.flex) {
      // Round fractionalRolumns up or down so we match ideal size as closely as we can
      metrics.rolumns = Math.round(fractionalRolumns);
      // Calculate the flexed item size
      metrics.itemSize2 = Math.round((availableSpace - (metrics.gap2 * (metrics.rolumns - 1))) / metrics.rolumns);
      // Calculate item size in the other dimension, preserving area (the default), aspect ratio or ideal size in that dimension as specified
      const preserve = this.flex === true ? 'area' : (this.flex.preserve);
      switch (preserve) {
        case 'aspect-ratio':
          metrics.itemSize1 = Math.round((this._idealSize1 / this._idealSize2) * metrics.itemSize2);
          break;
        case dim1(this.direction):
          metrics.itemSize1 = Math.round(this._idealSize1);
          break;
        case 'area':
        default:
          metrics.itemSize1 = Math.round((this._idealSize1 * this._idealSize2) / metrics.itemSize2);
      }
    }
    else {
      // We're not flexing, so use the specified sizes unmodified
      metrics.itemSize1 = this._idealSize1;
      metrics.itemSize2 = this._idealSize2;
      // And since we can't reduce item sizes to fit in another rolumn, we go with the lower number
      metrics.rolumns = Math.floor(fractionalRolumns);
    }
    // 4. Calculate the position for each item in a template rolumn
    let pos: number, space: number;
    if (this.flex || [ 'start', 'center', 'end' ].includes(justify)) {
      const spaceTaken = (metrics.rolumns * metrics.itemSize2) + ((metrics.rolumns - 1) * metrics.gap2);
      pos =
        this.flex || justify === 'start'
          ? metrics.padding2.start
          : justify === 'end'
            ? this._viewDim2 - metrics.padding2.end - spaceTaken
            : Math.round((this._viewDim2 / 2) - (spaceTaken / 2));
      space = metrics.gap2;
    }
    else {
      const spaceToDivide = availableSpace - (metrics.rolumns * metrics.itemSize2);
      if (justify === 'space-between') {
        space = Math.round(spaceToDivide / (metrics.rolumns - 1));
        pos = 0;
      }
      else if (justify === 'space-around') {
        space = Math.round(spaceToDivide / metrics.rolumns);
        pos = Math.round(space / 2);
      }
      else { // justify == 'space-evenly'
        space = Math.round(spaceToDivide / (metrics.rolumns + 1));
        pos = space;
      }
      // If primary-axis gap was set to 'auto', provide the value now
      // (and set 'match-gap' padding values transitively)
      if (this._gap1 === Infinity) {
        metrics.gap1 = space;
        if (padding1Start === Infinity) {
          metrics.padding1.start = pos;
        }
        if (padding1End === Infinity) {
          metrics.padding1.end = pos;
        }
      }
    }
    for (let i = 0; i < metrics.rolumns; i++) {
      metrics.positions.push(pos);
      pos += metrics.itemSize2 + space;
    }
  
    this._metrics = metrics;
  }

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
      [this._secondarySizeDim]: this._metrics!.itemSize2
    } as unknown as Size;
  }

  _getActiveItems() {
    // const [startPadding1, endPadding1] = this._padding1;
    const { padding1 } = this._metrics!;
    const min = Math.max(0, this._scrollPosition - this._overhang);
    const max = Math.min(
        this._scrollSize,
        this._scrollPosition + this._viewDim1 + this._overhang);
    const firstCow = Math.max(0, Math.floor((min - padding1.start) / this._delta));
    const lastCow = Math.max(0, Math.ceil((max - padding1.start) / this._delta));

    this._first = firstCow * this._metrics!.rolumns;
    this._last =
        Math.min(((lastCow) * this._metrics!.rolumns) - 1, this._totalItems - 1);
    this._physicalMin = padding1.start + (this._delta * firstCow);
    this._physicalMax = padding1.start + this._delta * lastCow;
  }

  _getItemPosition(idx: number): Positions {
    const { rolumns, padding1, positions, itemSize1, itemSize2 } = this._metrics!;
    return {
      [this._positionDim]: padding1.start + Math.floor(idx / rolumns) * this._delta,
      [this._secondaryPositionDim]: positions[idx % rolumns],
      [dim1(this.direction)]: itemSize1,
      [dim2(this.direction)]: itemSize2
    } as unknown as {top: number, left: number};
  }

  _updateScrollSize() {
    this._scrollSize =
        Math.max(1, Math.ceil(this._totalItems / this._metrics!.rolumns) * this._delta + this._gap!);
  }
}
