import {Layout1dBase} from './Layout1dBase.js';

export class Layout1dGrid extends Layout1dBase {
  constructor(config) {
    super(config);
    this._rolumns = 1;
  }

  updateItemSizes(sizes) {
    // Assume all items have the same size.
    const size = Object.values(sizes)[0];
    if (size) {
      this.itemSize = size;
    }
  }

  _viewDim2Changed() {
    this._defineGrid();
  }

  _itemDim2Changed() {
    this._defineGrid();
  }

  _getActiveItems() {
    const min = Math.max(0, this._scrollPosition - this._overhang);
    const max = Math.min(
        this._scrollSize,
        this._scrollPosition + this._viewDim1 + this._overhang);
    const firstCow = Math.floor(min / this._delta);
    const lastCow = Math.ceil(max / this._delta) - 1;

    this._first = firstCow * this._rolumns;
    this._last =
        Math.min(((lastCow + 1) * this._rolumns) - 1, this._totalItems);
    this._physicalMin = this._delta * firstCow;
    this._physicalMax = this._delta * (lastCow + 1);
  }

  _getItemPosition(idx) {
    return {
      [this._positionDim]: Math.floor(idx / this._rolumns) * this._delta,
          [this._secondaryPositionDim]: this._spacing +
          ((idx % this._rolumns) * (this._spacing + this._itemDim2))
    }
  }

  _defineGrid() {
    const {_spacing} = this;
    this._rolumns = Math.max(1, Math.floor(this._viewDim2 / this._itemDim2));
    if (this._rolumns > 1) {
      this._spacing = (this._viewDim2 % (this._rolumns * this._itemDim2)) /
          (this._rolumns + 1);
    }
    this._spacingChanged = !(_spacing === this._spacing);
    this._scheduleReflow();
  }

  _updateScrollSize() {
    this._scrollSize =
        Math.max(1, Math.ceil(this._totalItems / this._rolumns) * this._delta);
  }
}
