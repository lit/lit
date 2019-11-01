import {Layout1dBase} from './Layout1dBase';
import {ItemBox, Positions, Size} from './Layout';

/**
 * TODO @straversi: document and test this Layout.
 */
export class Layout1dFlex extends Layout1dBase {
  private _itemSizes: Array<Size> = [];
  private _itemPositions: Array<Positions> = [];
  private _rolumnStartIdx: Array<number> = [];
  private _rolumnStartPos: Array<number> = [];
//   private _meanRolumnSize: Number = 100;
  protected _idealSize: number;
  private _pendingLayout: boolean = false;

  constructor(config) {
    super(config);
    if (config.idealSize === undefined) {
        this._idealSize = 200;
    }
  }

  set direction(dir) {
    super.direction = dir;
    this._scheduleLayout();
  }

  set spacing(px) {
    super.spacing = px;
    this._scheduleLayout();
  }

  // set spacing(px) {
  //   if (px !== this._spacing) {
  //     this._spacing = Number(px);
  //     this._scheduleLayout();
  //   //   this._scheduleReflow();
  //   }
  // }

  set idealSize(px) {
    if (px !== this._idealSize) {
      this._idealSize = Number(px);
      this._scheduleLayout();
    //   this._scheduleReflow();
    }
  }

  updateItemSizes(sizes: {[key: number]: ItemBox}) {
    Object.keys(sizes).forEach((key) => {
        this._itemSizes[Number(key)] = sizes[key];
      });
      this._defineLayout();
    //   this._scheduleReflow();
}

  _viewDim2Changed() {
    this._scheduleLayout();
    // this._scheduleReflow();
  }

  _getActiveItems() {
    if (this._rolumnStartIdx.length === 0) return;
    const scrollPos = Math.min(this._scrollPosition, this._scrollSize - this._viewDim1);
    const min = Math.max(0, scrollPos - this._overhang);
    const max = Math.min(
        this._scrollSize,
        scrollPos + this._viewDim1 + this._overhang);
    const mid = (min + max) / 2;
    const estMidRolumn = Math.round((mid / this._scrollSize) * this._rolumnStartIdx.length);
    let idx = estMidRolumn;
    while (this._rolumnStartPos[idx] < min) {
        idx++;
    }
    while (this._rolumnStartPos[idx] > min) {
        idx--;
    }
    this._first = this._rolumnStartIdx[idx];
    this._physicalMin = this._rolumnStartPos[idx];
    let rolumnMax;
    while ((rolumnMax = this._rolumnStartPos[idx] + this._itemPositions[this._rolumnStartIdx[idx]][this._sizeDim] + (this._spacing * 2)) < max) {
        idx++;
    }
    this._last = (idx === this._rolumnStartIdx.length - 1) ? this._itemSizes.length - 1 : this._rolumnStartIdx[idx + 1] - 1;
    this._physicalMax = rolumnMax;
  }

  _getItemPosition(idx: number): Positions {
      return this._itemPositions[idx];
  }


  /**
   * Render at the next opportunity.
   */
  protected async _scheduleLayout(): Promise<void> {
    if (!this._pendingLayout) {
      this._pendingLayout = true;
      await Promise.resolve();
      this._pendingLayout = false;
      this._defineLayout();
    }
  }


  _defineLayout(): void {
    if (this._rolumnStartIdx === undefined || this._viewDim2 === 0) return;
    // TODO: An odd place to do this, need to think through the logistics of getting size info to the layout
    // in all cases
    this._itemSizes.length = this._totalItems;
    this._rolumnStartIdx.length = 0;
    this._rolumnStartPos.length = 0;
    this._itemPositions.length = 0;
    let startPos = this._spacing;
    let startIdx = 0;
    let idx = 0;
    let rolumnSize = 0;
    let lastRatio = Infinity;
    const finishRolumn = (lastIdx) => {
        this._rolumnStartIdx.push(startIdx);
        this._rolumnStartPos.push(startPos - this._spacing);
        let itemStartPos = this._spacing;
        for (let i = startIdx; i <= lastIdx; i++) {
            const pos = this._itemPositions[i];
            pos.width = pos.width * lastRatio;
            pos.height = pos.height * lastRatio;
            pos.left = this._positionDim === 'left' ? startPos : itemStartPos;
            pos.top = this._positionDim === 'top' ? startPos : itemStartPos;
            itemStartPos += pos[this._secondarySizeDim] + this._spacing;
        }
    }
    while (idx < this._totalItems) {
        const itemDims = this._itemSizes[idx];
        // if (!itemDims) throw new Error(`No item dimensions found for index ${idx}`);
        if (!itemDims) return;
        const availableSpace = this._viewDim2 - (this._spacing * (idx - startIdx + 2));
        const itemSize = itemDims[this._sizeDim];
        const itemSize2 = itemDims[this._secondarySizeDim];
        const idealScaleFactor = this._idealSize / itemSize;
        const adjItemSize = idealScaleFactor * itemSize;
        const adjItemSize2 = idealScaleFactor * itemSize2;
        this._itemPositions[idx] = {
            left: 0,
            top: 0,
            width: (this._sizeDim === 'width' ? adjItemSize : adjItemSize2),
            height: (this._sizeDim === 'height' ? adjItemSize : adjItemSize2)
        };
        const ratio = availableSpace / (rolumnSize + adjItemSize2);
        if (Math.abs(1 - ratio) > Math.abs(1 - lastRatio)) {
            // rolumn is better without adding this item
            finishRolumn(idx - 1);
            startIdx = idx;
            startPos += (this._idealSize * lastRatio) + this._spacing;
            lastRatio = (this._viewDim2 - (2 * this._spacing)) / adjItemSize2;
            rolumnSize = adjItemSize2;
        }
        else {
            // add this item and continue
            rolumnSize += adjItemSize2;
            lastRatio = ratio;
        }
        if (idx === this._itemSizes.length - 1) {
            finishRolumn(idx);
        }
        idx++;
    }
    // TODO: This is a hack to force reflow
    this._spacingChanged = true;
    this._scheduleReflow();
}

  _updateScrollSize() {
    this._scrollSize = this._rolumnStartIdx.length === 0 ? 1 :
        this._rolumnStartPos[this._rolumnStartPos.length - 1] +
        this._itemPositions[this._itemPositions.length - 1][this._sizeDim] +
        (this._spacing * 2);
  }
}
