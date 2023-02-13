/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {SizeCache} from './shared/SizeCache.js';
import {
  SizeGapPaddingBaseLayout,
  SizeGapPaddingBaseLayoutConfig,
  GapSpec,
} from './shared/SizeGapPaddingBaseLayout.js';
import {
  ChildMeasurements,
  ItemBox,
  LayoutHostSink,
  LogicalSize,
  MeasureChildFunction,
  Positions,
} from './shared/Layout.js';

interface FlexWrapLayoutConfig extends SizeGapPaddingBaseLayoutConfig {
  gap?: GapSpec;
}

type FlexWrapLayoutSpecifier = FlexWrapLayoutConfig & {
  type: new (
    hostSink: LayoutHostSink,
    config?: FlexWrapLayoutConfig
  ) => FlexWrapLayout;
};

type FlexWrapLayoutSpecifierFactory = (
  config?: FlexWrapLayoutConfig
) => FlexWrapLayoutSpecifier;

export const layout1dFlex: FlexWrapLayoutSpecifierFactory = (
  config?: FlexWrapLayoutConfig
) =>
  Object.assign(
    {
      type: FlexWrapLayout,
    },
    config
  );

interface Rolumn {
  _startIdx: number;
  _endIdx: number;
  _startPos: number;
  _size: number;
}

interface Chunk {
  _itemPositions: Array<Positions>;
  _rolumns: Array<Rolumn>;
  _size: number;
  _dirty: boolean;
}

interface AspectRatios {
  // conceptually,  key is a number, but strictly speaking it's a string
  [key: string]: number;
}

/**
 * TODO graynorton@ Don't hard-code Flickr - probably need a config option
 */
interface FlickrImageData {
  o_width: number;
  o_height: number;
}

/**
 * TODO @straversi: document and test this Layout.
 */
export class FlexWrapLayout extends SizeGapPaddingBaseLayout<FlexWrapLayoutConfig> {
  private _itemSizes: Array<LogicalSize> = [];
  // private _itemPositions: Array<Positions> = [];
  // private _rolumnStartIdx: Array<number> = [];
  // private _rolumnStartPos: Array<number> = [];
  private _chunkLength: number | null = null;
  private _chunks: Array<Chunk> = [];
  private _chunkSizeCache = new SizeCache();
  private _rolumnSizeCache = new SizeCache();
  private _rolumnLengthCache = new SizeCache({roundAverageSize: false});
  // private _rolumnStartPositions: Map<number, number> = new Map();
  private _aspectRatios: AspectRatios = {};
  private _numberOfAspectRatiosMeasured = 0;
  // protected _config: FlexWrapLayoutConfig = {};

  listenForChildLoadEvents = true;

  set gap(spec: GapSpec) {
    super.gap = spec;
  }

  /**
   * TODO graynorton@ Don't hard-code Flickr - probably need a config option
   */
  measureChildren: MeasureChildFunction = (e: Element, i: unknown) => {
    const {naturalWidth, naturalHeight} = e as HTMLImageElement;
    let width = -1;
    let height = -1;
    if (naturalWidth !== undefined && naturalHeight != undefined) {
      width = naturalWidth;
      height = naturalHeight;
    } else {
      const {o_width, o_height} = i as FlickrImageData;
      if (o_width !== undefined && o_height !== undefined) {
        width = o_width;
        height = o_height;
      }
    }
    if (this.writingMode[0] === 'h') {
      return {inlineSize: width, blockSize: height};
    } else {
      return {inlineSize: height, blockSize: width};
    }
  };

  updateItemSizes(sizes: ChildMeasurements) {
    let dirty;
    Object.keys(sizes).forEach((key) => {
      const n = Number(key);
      const chunk = this._getChunk(n);
      const dims = sizes[n];
      const prevDims: ItemBox = this._itemSizes[n];
      if (dims.inlineSize && dims.blockSize) {
        if (
          !prevDims ||
          prevDims.inlineSize !== dims.inlineSize ||
          prevDims.blockSize !== dims.blockSize
        ) {
          chunk._dirty = true;
          dirty = true;
          this._itemSizes[n] = sizes[n];
          this._recordAspectRatio(sizes[n]);
        }
      }
    });
    if (dirty) {
      this._scheduleLayoutUpdate();
    }
  }

  _newChunk() {
    return {
      ['_rolumns']: [],
      _itemPositions: [],
      _size: 0,
      _dirty: false,
    };
  }

  _getChunk(idx: number | string) {
    return (
      this._chunks[Math.floor(Number(idx) / this._chunkLength!)] ||
      this._newChunk()
    );
  }

  _recordAspectRatio(dims: ItemBox) {
    if (dims.inlineSize && dims.blockSize) {
      const bucket = Math.round((dims.inlineSize / dims.blockSize) * 10) / 10;
      if (this._aspectRatios[bucket]) {
        this._aspectRatios[bucket]++;
      } else {
        this._aspectRatios[bucket] = 1;
      }
      this._numberOfAspectRatiosMeasured++;
    }
  }

  _getRandomAspectRatio(): LogicalSize {
    if (this._numberOfAspectRatiosMeasured === 0) {
      return {inlineSize: 1, blockSize: 1};
    }
    const n = Math.random() * this._numberOfAspectRatiosMeasured;
    const buckets = Object.keys(this._aspectRatios);
    let i = -1,
      m = 0;
    while (m < n && i < buckets.length) {
      m += this._aspectRatios[buckets[++i]];
    }
    return {inlineSize: Number(buckets[i]), blockSize: 1};
  }

  // _viewDim2Changed() {
  //   this._scheduleLayoutUpdate();
  // }

  _getActiveItems() {
    const chunk = this._getChunk(0);
    if (chunk._rolumns.length === 0) return;
    const scrollPos = Math.max(
      0,
      Math.min(
        this._blockScrollPosition,
        this._virtualizerSize - this._viewDim1
      )
    );
    const min = Math.max(0, scrollPos - this._overhang);
    const max = Math.min(
      this._virtualizerSize,
      scrollPos + this._viewDim1 + this._overhang
    );
    const mid = (min + max) / 2;
    const estMidRolumn = Math.round(
      (mid / this._virtualizerSize) * chunk._rolumns.length
    );
    let idx = estMidRolumn;
    while (chunk._rolumns[idx]._startPos < min) {
      idx++;
    }
    while (chunk._rolumns[idx]._startPos > min) {
      idx--;
    }
    this._first = chunk._rolumns[idx]._startIdx;
    this._physicalMin = chunk._rolumns[idx]._startPos;
    let rolumnMax;
    while (
      (rolumnMax =
        chunk._rolumns[idx]._startPos +
        chunk._rolumns[idx]._size +
        this._gap! * 2) < max
    ) {
      idx++;
    }
    this._last = chunk._rolumns[idx]._endIdx;
    this._physicalMax = rolumnMax;
  }

  _getItemPosition(idx: number): Positions {
    const chunk = this._getChunk(0);
    return chunk._itemPositions[idx];
  }

  _getItemSize(idx: number): LogicalSize {
    const chunk = this._getChunk(0);
    const {inlineSize, blockSize} = chunk._itemPositions[idx];
    return {inlineSize, blockSize} as LogicalSize;
  }

  _getNaturalItemDims(idx: number): LogicalSize {
    let itemDims = this._itemSizes[idx];
    if (
      itemDims === undefined ||
      itemDims.inlineSize === -1 ||
      itemDims.blockSize === -1
    ) {
      itemDims = this._getRandomAspectRatio();
    }
    return itemDims;
  }

  _layOutChunk(startIdx: number, endIdx: number /*, reverse=false*/) {
    const chunk: Chunk = this._newChunk();
    const gap = this._gap!;
    let startPos = gap;
    let idx = 0;
    let rolumnSize2 = 0;
    let lastRatio = Infinity;
    const finishRolumn = (lastIdx: number) => {
      const rolumn = {
        _startIdx: startIdx,
        _endIdx: lastIdx,
        _startPos: startPos - gap,
        _size: 0,
      };
      chunk._rolumns.push(rolumn);
      let itemStartPos = this._gap!;
      for (let i = startIdx; i <= lastIdx; i++) {
        const pos = chunk._itemPositions[i];
        pos.inlineSize = pos.inlineSize! * lastRatio;
        pos.blockSize = pos.blockSize! * lastRatio;
        pos.insetInlineStart = itemStartPos;
        pos.insetBlockStart = startPos;
        itemStartPos += pos.inlineSize! + gap;
      }
      rolumn._size = chunk._itemPositions[lastIdx].blockSize!;
    };
    while (idx <= endIdx) {
      const itemDims = this._getNaturalItemDims(idx);
      const availableSpace = this._viewDim2 - gap * (idx - startIdx + 2);
      const itemSize = itemDims.blockSize;
      const itemSize2 = itemDims.inlineSize;
      const idealScaleFactor = this._idealSize! / itemSize;
      const adjItemSize = idealScaleFactor * itemSize;
      const adjItemSize2 = idealScaleFactor * itemSize2;
      chunk._itemPositions[idx] = {
        insetBlockStart: 0,
        insetInlineStart: 0,
        inlineSize: adjItemSize2,
        blockSize: adjItemSize,
      };
      const ratio = availableSpace / (rolumnSize2 + adjItemSize2);
      if (Math.abs(1 - ratio) > Math.abs(1 - lastRatio)) {
        // rolumn is better without adding this item
        finishRolumn(idx - 1);
        startIdx = idx;
        startPos += this._idealSize! * lastRatio + gap;
        lastRatio = (this._viewDim2 - 2 * gap) / adjItemSize2;
        rolumnSize2 = adjItemSize2;
      } else {
        // add this item and continue
        rolumnSize2 += adjItemSize2;
        lastRatio = ratio;
      }
      if (idx === endIdx) {
        finishRolumn(idx);
      }
      idx++;
    }
    const lastRolumn = chunk._rolumns[chunk._rolumns.length - 1];
    chunk._size = lastRolumn._startPos + lastRolumn._size;
    return chunk;
  }

  _updateLayout(): void {
    if (/*this._rolumnStartIdx === undefined ||*/ this._viewDim2 === 0) return;
    this._chunkLength = Math.ceil(
      (2 * (this._viewDim1 * this._viewDim2)) /
        (this._idealSize! * this._idealSize!)
    );
    console.log('chunkLength', this._chunkLength);
    // TODO: An odd place to do this, need to think through the logistics of getting size info to the layout
    // in all cases
    // this._itemSizes.length = 100;//this._totalItems;
    const chunk = this._layOutChunk(0, this._chunkLength - 1);
    this._chunks[0] = chunk;
    this._chunkSizeCache.set(0, chunk._size);
    chunk._rolumns.forEach((rolumn, idx) => {
      const id = `0:${idx}`;
      this._rolumnSizeCache.set(id, rolumn._size);
      this._rolumnLengthCache.set(id, rolumn._endIdx - rolumn._startIdx + 1);
    });
  }

  _updateVirtualizerSize() {
    const chunk = this._chunks[0];
    this._virtualizerSize =
      !chunk || chunk._rolumns.length === 0 ? 1 : chunk._size + 2 * this._gap!;
    // chunk._rolumns[chunk._rolumns.length - 1]._startPos +
    // chunk._itemPositions[chunk._rolumns.length - 1][this._sizeDim] +
    // (this._gap * 2);
  }
}
