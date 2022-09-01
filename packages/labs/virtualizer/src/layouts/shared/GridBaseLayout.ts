/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  SizeGapPaddingBaseLayout,
  SizeGapPaddingBaseLayoutConfig,
  AutoGapSpec,
  gap2 as gap2Name,
} from './SizeGapPaddingBaseLayout.js';
import {dim1} from './BaseLayout.js';

type FlexSpec =
  | boolean
  | {preserve: 'aspect-ratio' | 'area' | 'width' | 'height'};
type JustifySpec =
  | 'start'
  | 'center'
  | 'end'
  | 'space-evenly'
  | 'space-around'
  | 'space-between';

export interface GridBaseLayoutConfig
  extends Omit<SizeGapPaddingBaseLayoutConfig, 'gap'> {
  gap?: AutoGapSpec;
  flex?: FlexSpec;
  justify?: JustifySpec;
}

interface GridLayoutMetrics {
  rolumns: number;
  itemSize1: number;
  itemSize2: number;
  gap1: number;
  gap2: number;
  padding1: {
    start: number;
    end: number;
  };
  padding2: {
    start: number;
    end: number;
  };
  positions: number[];
}

///

export abstract class GridBaseLayout<
  C extends GridBaseLayoutConfig
> extends SizeGapPaddingBaseLayout<C> {
  protected _metrics: GridLayoutMetrics | null = null;
  flex: FlexSpec | null = null;
  justify: JustifySpec | null = null;

  protected get _defaultConfig(): C {
    return Object.assign({}, super._defaultConfig, {
      flex: false,
      justify: 'start',
    });
  }

  set gap(spec: AutoGapSpec) {
    super.gap = spec;
  }

  protected _updateLayout() {
    const justify = this.justify as JustifySpec;
    const [padding1Start, padding1End] = this._padding1;
    const [padding2Start, padding2End] = this._padding2;

    // TODO (graynorton): Omit these checks in production mode
    ['_gap1', '_gap2'].forEach((gap) => {
      const gapValue = this[gap as '_gap1' | '_gap2'];
      if (
        gapValue === Infinity &&
        !['space-between', 'space-around', 'space-evenly'].includes(justify)
      ) {
        throw new Error(
          `grid layout: gap can only be set to 'auto' when justify is set to 'space-between', 'space-around' or 'space-evenly'`
        );
      }
      if (gapValue === Infinity && gap === '_gap2') {
        throw new Error(
          `grid layout: ${gap2Name(
            this.direction
          )}-gap cannot be set to 'auto' when direction is set to ${
            this.direction
          }`
        );
      }
    });

    const usePaddingAndGap2 =
      this.flex || ['start', 'center', 'end'].includes(justify);

    const metrics: GridLayoutMetrics = {
      rolumns: -1,
      itemSize1: -1,
      itemSize2: -1,
      // Infinity represents 'auto', so we set an invalid placeholder until we can calculate
      gap1: this._gap1 === Infinity ? -1 : this._gap1,
      gap2: usePaddingAndGap2 ? this._gap2 : 0,
      // Infinity represents 'match-gap', so we set padding to match gap
      padding1: {
        start: padding1Start === Infinity ? this._gap1 : padding1Start,
        end: padding1End === Infinity ? this._gap1 : padding1End,
      },
      padding2: usePaddingAndGap2
        ? {
            start: padding2Start === Infinity ? this._gap2 : padding2Start,
            end: padding2End === Infinity ? this._gap2 : padding2End,
          }
        : {
            start: 0,
            end: 0,
          },
      positions: [],
    };

    let availableSpace = this._viewDim2;
    if (availableSpace === 0) {
      metrics.rolumns = 0;
    } else {
      // 1. Adjust available space to account for padding
      availableSpace -= metrics.padding2.start;
      availableSpace -= metrics.padding2.end;
      // 2. Calculate roughly how many "rolumns" fit in the available space
      const spacePerRolumn =
        this._idealSize2 + (usePaddingAndGap2 ? metrics.gap2 : 0);
      const fractionalRolumns = availableSpace / spacePerRolumn;
      // 3. Calculate item size (if we're flexing) and finalize the number of rolumns accordingly
      if (this.flex) {
        // Round fractionalRolumns up or down so we match ideal size as closely as we can
        metrics.rolumns = Math.round(fractionalRolumns);
        // Calculate the flexed item size
        metrics.itemSize2 = Math.round(
          (availableSpace - metrics.gap2 * (metrics.rolumns - 1)) /
            metrics.rolumns
        );
        // Calculate item size in the other dimension, preserving area (the default), aspect ratio or ideal size in that dimension as specified
        const preserve = this.flex === true ? 'area' : this.flex.preserve;
        switch (preserve) {
          case 'aspect-ratio':
            metrics.itemSize1 = Math.round(
              (this._idealSize1 / this._idealSize2) * metrics.itemSize2
            );
            break;
          case dim1(this.direction):
            metrics.itemSize1 = Math.round(this._idealSize1);
            break;
          case 'area':
          default:
            metrics.itemSize1 = Math.round(
              (this._idealSize1 * this._idealSize2) / metrics.itemSize2
            );
        }
      } else {
        // We're not flexing, so use the specified sizes unmodified
        metrics.itemSize1 = this._idealSize1;
        metrics.itemSize2 = this._idealSize2;
        // And since we can't reduce item sizes to fit in another rolumn, we go with the lower number
        metrics.rolumns = Math.floor(fractionalRolumns);
      }
      // 4. Calculate the position for each item in a template rolumn
      let pos: number;
      if (usePaddingAndGap2) {
        const spaceTaken =
          metrics.rolumns * metrics.itemSize2 +
          (metrics.rolumns - 1) * metrics.gap2;
        pos =
          this.flex || justify === 'start'
            ? metrics.padding2.start
            : justify === 'end'
            ? this._viewDim2 - metrics.padding2.end - spaceTaken
            : Math.round(this._viewDim2 / 2 - spaceTaken / 2);
      } else {
        const spaceToDivide =
          availableSpace - metrics.rolumns * metrics.itemSize2;
        if (justify === 'space-between') {
          metrics.gap2 = Math.round(spaceToDivide / (metrics.rolumns - 1));
          pos = 0;
        } else if (justify === 'space-around') {
          metrics.gap2 = Math.round(spaceToDivide / metrics.rolumns);
          pos = Math.round(metrics.gap2 / 2);
        } else {
          // justify == 'space-evenly'
          metrics.gap2 = Math.round(spaceToDivide / (metrics.rolumns + 1));
          pos = metrics.gap2;
        }
        // If primary-axis gap was set to 'auto', provide the value now
        // (and set 'match-gap' padding values transitively)
        if (this._gap1 === Infinity) {
          metrics.gap1 = metrics.gap2;
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
        pos += metrics.itemSize2 + metrics.gap2;
      }
    }

    this._metrics = metrics;
  }
}
