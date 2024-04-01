/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// import { dimension } from './Layout.js';
import {BaseLayoutConfig} from './Layout.js';
import {BaseLayout, dim1, dim2} from './BaseLayout.js';
import {ScrollDirection, Size} from './Layout.js';

export type PixelSize = `${'0' | `${number}px`}`;

type GapValue = PixelSize;
type TwoGapValues = `${GapValue} ${GapValue}`;

export type GapSpec = GapValue | TwoGapValues;

export type AutoGapSpec =
  | PixelSize
  | `${PixelSize} ${PixelSize}`
  | `auto ${PixelSize}`
  | `${PixelSize} auto`;

type PaddingValue = PixelSize | 'match-gap';
type TwoPaddingValues = `${PaddingValue} ${PaddingValue}`;
type ThreePaddingValues = `${TwoPaddingValues} ${PaddingValue}`;
type FourPaddingValues = `${ThreePaddingValues} ${PaddingValue}`;
type PaddingSpec =
  | PaddingValue
  | TwoPaddingValues
  | ThreePaddingValues
  | FourPaddingValues;

type PixelDimensions = {width: PixelSize; height: PixelSize};

// function numberToPixelSize(n: number): PixelSize {
//     return n === 0 ? '0' : `${n}px`;
// }

function paddingValueToNumber(v: PaddingValue): number {
  if (v === 'match-gap') {
    return Infinity;
  }
  return parseInt(v);
}

function gapValueToNumber(v: GapValue | 'auto'): number {
  if (v === 'auto') {
    return Infinity;
  }
  return parseInt(v);
}

export function gap1(direction: ScrollDirection) {
  return direction === 'horizontal' ? 'column' : 'row';
}

export function gap2(direction: ScrollDirection) {
  return direction === 'horizontal' ? 'row' : 'column';
}

export function padding1(direction: ScrollDirection): [side, side] {
  return direction === 'horizontal' ? ['left', 'right'] : ['top', 'bottom'];
}

export function padding2(direction: ScrollDirection): [side, side] {
  return direction === 'horizontal' ? ['top', 'bottom'] : ['left', 'right'];
}

export interface SizeGapPaddingBaseLayoutConfig extends BaseLayoutConfig {
  // gap?: GapSpec,
  padding?: PaddingSpec;
  itemSize?: PixelDimensions | PixelSize;
}

type gap = 'row' | 'column';
type side = 'top' | 'right' | 'bottom' | 'left';
type Gaps = {[key in gap]: number};
type Padding = {[key in side]: number};

export abstract class SizeGapPaddingBaseLayout<
  C extends SizeGapPaddingBaseLayoutConfig,
> extends BaseLayout<C> {
  protected _itemSize: Size | {} = {};
  protected _gaps: Gaps | {} = {};
  protected _padding: Padding | {} = {};

  protected _getDefaultConfig(): C {
    return Object.assign({}, super._getDefaultConfig(), {
      itemSize: {width: '300px', height: '300px'},
      gap: '8px',
      padding: 'match-gap',
    }) as C;
  }

  // Temp, to support current flexWrap implementation
  protected get _gap(): number {
    return (this._gaps as Gaps).row;
  }

  // Temp, to support current flexWrap implementation
  protected get _idealSize(): number {
    return (this._itemSize as Size)[dim1(this.direction)];
  }

  protected get _idealSize1(): number {
    return (this._itemSize as Size)[dim1(this.direction)];
  }

  protected get _idealSize2(): number {
    return (this._itemSize as Size)[dim2(this.direction)];
  }

  protected get _gap1(): number {
    return (this._gaps as Gaps)[gap1(this.direction)];
  }

  protected get _gap2(): number {
    return (this._gaps as Gaps)[gap2(this.direction)];
  }

  protected get _padding1(): [number, number] {
    const padding = this._padding as Padding;
    const [start, end] = padding1(this.direction);
    return [padding[start], padding[end]];
  }

  protected get _padding2(): [number, number] {
    const padding = this._padding as Padding;
    const [start, end] = padding2(this.direction);
    return [padding[start], padding[end]];
  }

  set itemSize(dims: PixelDimensions | PixelSize) {
    const size = this._itemSize as Size;
    if (typeof dims === 'string') {
      dims = {
        width: dims,
        height: dims,
      };
    }
    const width = parseInt(dims.width);
    const height = parseInt(dims.height);
    if (width !== size.width) {
      size.width = width;
      this._triggerReflow();
    }
    if (height !== size.height) {
      size.height = height;
      this._triggerReflow();
    }
  }

  set gap(spec: GapSpec | AutoGapSpec) {
    this._setGap(spec);
  }

  // This setter is overridden in specific layouts to narrow the accepted types
  protected _setGap(spec: GapSpec | AutoGapSpec) {
    const values = spec.split(' ').map((v) => gapValueToNumber(v as GapValue));
    const gaps = this._gaps as Gaps;
    if (values[0] !== gaps.row) {
      gaps.row = values[0];
      this._triggerReflow();
    }
    if (values[1] === undefined) {
      if (values[0] !== gaps.column) {
        gaps.column = values[0];
        this._triggerReflow();
      }
    } else {
      if (values[1] !== gaps.column) {
        gaps.column = values[1];
        this._triggerReflow();
      }
    }
  }

  set padding(spec: PaddingSpec) {
    const padding = this._padding as Padding;
    const values = spec
      .split(' ')
      .map((v) => paddingValueToNumber(v as PaddingValue));
    if (values.length === 1) {
      padding.top = padding.right = padding.bottom = padding.left = values[0];
      this._triggerReflow();
    } else if (values.length === 2) {
      padding.top = padding.bottom = values[0];
      padding.right = padding.left = values[1];
      this._triggerReflow();
    } else if (values.length === 3) {
      padding.top = values[0];
      padding.right = padding.left = values[1];
      padding.bottom = values[2];
      this._triggerReflow();
    } else if (values.length === 4) {
      ['top', 'right', 'bottom', 'left'].forEach(
        (side, idx) => (padding[side as side] = values[idx])
      );
      this._triggerReflow();
    }
  }
}
