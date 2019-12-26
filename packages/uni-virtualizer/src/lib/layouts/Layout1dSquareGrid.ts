import {Layout1dGrid} from './Layout1dGrid.js';
import {Positions} from './Layout.js';

export class Layout1dSquareGrid extends Layout1dGrid {
  protected _idealSize: number;

  constructor(config) {
    super(config);
    if (config.idealSize === undefined) {
        this._idealSize = 200;
    }
  }

  set idealSize(px) {
    if (px !== this._idealSize) {
      this._idealSize = px;
      this._scheduleLayoutUpdate();
    }
  }

  _getItemPosition(idx: number): Positions {
    return Object.assign(super._getItemPosition(idx), this._itemSize);
  }

  _updateLayout() {
    const frolumns = this._viewDim2 / this._idealSize;
    this._rolumns = frolumns % 1 < 0.5 ? Math.floor(frolumns) : Math.ceil(frolumns);
    const adjSize = (this._viewDim2 - ((this._rolumns + 1) * this._spacing)) / this._rolumns;
    if (adjSize !== this._itemSize.width) {
      this._itemSize = { width: adjSize, height: adjSize };
      this._spacingChanged = true;
    }
  }    
}