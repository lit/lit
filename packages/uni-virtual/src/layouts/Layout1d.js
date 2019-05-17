import {Layout1dBase} from './Layout1dBase.js';

export class Layout1d extends Layout1dBase {
  constructor(config) {
    super(config);
    this._physicalItems = new Map();
    this._newPhysicalItems = new Map();

    this._metrics = new Map();

    this._anchorIdx = null;
    this._anchorPos = null;
    this._stable = true;

    this._needsRemeasure = false;

    this._nMeasured = 0;
    this._tMeasured = 0;

    this._estimate = true;
  }

  updateItemSizes(sizes) {
    Object.keys(sizes).forEach((key) => {
      const metrics = sizes[key], mi = this._getMetrics(key),
            prevSize = mi[this._sizeDim];

      // TODO(valdrin) Handle margin collapsing.
      // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing
      mi.width = metrics.width + (metrics.marginLeft || 0) +
          (metrics.marginRight || 0);
      mi.height = metrics.height + (metrics.marginTop || 0) +
          (metrics.marginBottom || 0);

      const size = mi[this._sizeDim];
      const item = this._getPhysicalItem(Number(key));
      if (item) {
        let delta;

        if (size !== undefined) {
          item.size = size;
          if (prevSize === undefined) {
            delta = size;
            this._nMeasured++;
          } else {
            delta = size - prevSize;
          }
        }
        this._tMeasured = this._tMeasured + delta;
      }
    });
    if (!this._nMeasured) {
      console.warn(`No items measured yet.`);
    } else {
      this._updateItemSize();
      this._scheduleReflow();
    }
  }

  _updateItemSize() {
    // Keep integer values.
    this._itemSize[this._sizeDim] =
        Math.round(this._tMeasured / this._nMeasured);
  }

  _getMetrics(idx) {
    return (this._metrics[idx] = this._metrics[idx] || {});
  }

  _getPhysicalItem(idx) {
    return this._newPhysicalItems.get(idx) || this._physicalItems.get(idx);
  }

  _getSize(idx) {
    const item = this._getPhysicalItem(idx);
    return item && item.size;
  }

  _getPosition(idx) {
    const item = this._physicalItems.get(idx);
    return item ? item.pos : (idx * (this._delta)) + this._spacing;
  }

  _calculateAnchor(lower, upper) {
    if (lower === 0) {
      return 0;
    }
    if (upper > this._scrollSize - this._viewDim1) {
      return this._totalItems - 1;
    }
    return Math.max(
        0,
        Math.min(
            this._totalItems - 1,
            Math.floor(((lower + upper) / 2) / this._delta)));
  }

  _getAnchor(lower, upper) {
    if (this._physicalItems.size === 0) {
      return this._calculateAnchor(lower, upper);
    }
    if (this._first < 0) {
      console.error('_getAnchor: negative _first');
      return this._calculateAnchor(lower, upper);
    }
    if (this._last < 0) {
      console.error('_getAnchor: negative _last');
      return this._calculateAnchor(lower, upper);
    }

    const firstItem = this._getPhysicalItem(this._first),
          lastItem = this._getPhysicalItem(this._last),
          firstMin = firstItem.pos, firstMax = firstMin + firstItem.size,
          lastMin = lastItem.pos, lastMax = lastMin + lastItem.size;

    if (lastMax < lower) {
      // Window is entirely past physical items, calculate new anchor
      return this._calculateAnchor(lower, upper);
    }
    if (firstMin > upper) {
      // Window is entirely before physical items, calculate new anchor
      return this._calculateAnchor(lower, upper);
    }
    if (firstMin >= lower || firstMax >= lower) {
      // First physical item overlaps window, choose it
      return this._first;
    }
    if (lastMax <= upper || lastMin <= upper) {
      // Last physical overlaps window, choose it
      return this._last;
    }
    // Window contains a physical item, but not the first or last
    let maxIdx = this._last, minIdx = this._first;

    while (true) {
      let candidateIdx = Math.round((maxIdx + minIdx) / 2),
          candidate = this._physicalItems.get(candidateIdx),
          cMin = candidate.pos, cMax = cMin + candidate.size;

      if ((cMin >= lower && cMin <= upper) ||
          (cMax >= lower && cMax <= upper)) {
        return candidateIdx;
      } else if (cMax < lower) {
        minIdx = candidateIdx + 1;
      } else if (cMin > upper) {
        maxIdx = candidateIdx - 1;
      }
    }
  }

  _getActiveItems() {
    if (this._viewDim1 === 0 || this._totalItems === 0) {
      this._clearItems();
    } else {
      const upper = Math.min(
          this._scrollSize,
          this._scrollPosition + this._viewDim1 + this._overhang),
            lower = Math.max(0, upper - this._viewDim1 - (2 * this._overhang));

      this._getItems(lower, upper);
    }
  }

  _clearItems() {
    this._first = -1;
    this._last = -1;
    this._physicalMin = 0;
    this._physicalMax = 0;
    const items = this._newPhysicalItems;
    this._newPhysicalItems = this._physicalItems;
    this._newPhysicalItems.clear();
    this._physicalItems = items;
    this._stable = true;
  }

  _getItems(lower, upper) {
    const items = this._newPhysicalItems;

    // The anchorIdx is the anchor around which we reflow. It is designed to
    // allow jumping to any point of the scroll size. We choose it once and
    // stick with it until stable. first and last are deduced around it.
    if (this._anchorIdx === null || this._anchorPos === null) {
      this._anchorIdx = this._getAnchor(lower, upper);
      this._anchorPos = this._getPosition(this._anchorIdx);
    }

    let anchorSize = this._getSize(this._anchorIdx);
    if (anchorSize === undefined) {
      anchorSize = this._itemDim1;
    }

    // Anchor might be outside bounds, so prefer correcting the error and keep
    // that anchorIdx.
    let anchorErr = 0;

    if (this._anchorPos + anchorSize + this._spacing < lower) {
      anchorErr = lower - (this._anchorPos + anchorSize + this._spacing);
    }

    if (this._anchorPos > upper) {
      anchorErr = upper - this._anchorPos;
    }

    if (anchorErr) {
      this._scrollPosition -= anchorErr;
      lower -= anchorErr;
      upper -= anchorErr;
      this._scrollError += anchorErr;
    }

    items.set(this._anchorIdx, {pos: this._anchorPos, size: anchorSize});

    this._first = (this._last = this._anchorIdx);
    this._physicalMin = (this._physicalMax = this._anchorPos);

    this._stable = true;

    while (this._physicalMin > lower && this._first > 0) {
      let size = this._getSize(--this._first);
      if (size === undefined) {
        this._stable = false;
        size = this._itemDim1;
      }
      const pos = (this._physicalMin -= size + this._spacing);
      items.set(this._first, {pos, size});
      if (this._stable === false && this._estimate === false) {
        break;
      }
    }

    while (this._physicalMax < upper && this._last < this._totalItems) {
      let size = this._getSize(this._last);
      if (size === undefined) {
        this._stable = false;
        size = this._itemDim1;
      }
      items.set(this._last++, {pos: this._physicalMax, size});
      if (this._stable === false && this._estimate === false) {
        break;
      } else {
        this._physicalMax += size + this._spacing;
      }
    }

    this._last--;

    // This handles the cases where we were relying on estimated sizes.
    const extentErr = this._calculateError();
    if (extentErr) {
      this._physicalMin -= extentErr;
      this._physicalMax -= extentErr;
      this._anchorPos -= extentErr;
      this._scrollPosition -= extentErr;
      items.forEach(item => item.pos -= extentErr);
      this._scrollError += extentErr;
    }

    if (this._stable) {
      this._newPhysicalItems = this._physicalItems;
      this._newPhysicalItems.clear();
      this._physicalItems = items;
    }
  }

  _calculateError() {
    if (this._first === 0) {
      return this._physicalMin;
    } else if (this._physicalMin <= 0) {
      return this._physicalMin - (this._first * this._delta);
    } else if (this._last === this._maxIdx) {
      return this._physicalMax - this._scrollSize;
    } else if (this._physicalMax >= this._scrollSize) {
      return (
          (this._physicalMax - this._scrollSize) +
          ((this._totalItems - 1 - this._last) * this._delta));
    }
    return 0;
  }

  _updateScrollSize() {
    // Reuse previously calculated physical max, as it might be higher than the
    // estimated size.
    super._updateScrollSize();
    this._scrollSize = Math.max(this._physicalMax, this._scrollSize);
  }

  // TODO: Can this be made to inherit from base, with proper hooks?
  _reflow() {
    const {_first, _last, _scrollSize} = this;

    this._updateScrollSize();
    this._getActiveItems();
    this._scrollIfNeeded();

    if (this._scrollSize !== _scrollSize) {
      this._emitScrollSize();
    }

    this._emitRange();
    if (this._first === -1 && this._last === -1) {
      this._resetReflowState();
    } else if (
        this._first !== _first || this._last !== _last ||
        this._needsRemeasure) {
      this._emitChildPositions();
      this._emitScrollError();
    } else {
      this._emitChildPositions();
      this._emitScrollError();
      this._resetReflowState();
    }
  }

  _resetReflowState() {
    this._anchorIdx = null;
    this._anchorPos = null;
    this._stable = true;
  }

  _getItemPosition(idx) {
    return {
      [this._positionDim]: this._getPosition(idx),
      [this._secondaryPositionDim]: 0,
    };
  }

  _getItemSize(idx) {
    return {
      [this._sizeDim]: this._getSize(idx) || this._itemDim1,
      [this._secondarySizeDim]: this._itemDim2,
    };
  }

  _viewDim2Changed() {
    this._needsRemeasure = true;
    this._scheduleReflow();
  }

  _emitRange() {
    const remeasure = this._needsRemeasure;
    const stable = this._stable;
    this._needsRemeasure = false;
    super._emitRange({remeasure, stable});
  }
}
