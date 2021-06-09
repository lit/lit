import {Layout1dGrid} from './Layout1dGrid.js';
import {Layout1dBaseConfig} from './Layout1dBase.js';
import {ItemBox} from './Layout';

export class Layout1dNaturalSizeGrid extends Layout1dGrid<Layout1dBaseConfig> {
    updateItemSizes(sizes: {[key: number]: ItemBox}) {
        // Assume all items have the same size.
        const size = Object.values(sizes)[0];
        if (size) {
          this.itemSize = size;
        }
      }
    
      _updateLayout() {
        this._rolumns = Math.max(1, Math.floor(this._viewDim2 / this._itemDim2));
        if (this._rolumns > 1) {
          this._spacing = (this._viewDim2 % (this._rolumns * this._itemDim2)) /
              (this._rolumns + 1);
        }
        else {
          this._spacing = 0;
        }
      }        
}