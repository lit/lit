import {ItemBox, Margins} from './layouts/Layout.js';

export class VirtualRepeater<Item, Child extends Element, Key> {
  /**
   * Invoked when a new (not recycled) child needs to be displayed.
   * Set by createElement.
   */
  private _createElementFn: (item: Item, index: number) => Child = null;

  /**
   * Invoked on new (including recycled) children after the range changes.
   * Set by updateElement.
   */
  private _updateElementFn: (child: Child, item: Item, index: number) => void = null;

  /**
   * Invoked on outgoing children after the range changes. Set by recycleElement.
   */
  private _recycleElementFn: (child: Child, index: number) => void = null;

  /**
   * Used for generating a key for storing references to children. Set by elementKey.
   */
  private _elementKeyFn: (index: number) => Key = null;

  /**
   * Items to render. Set by items.
   */
  private _items: Array<Item> = [];

  /**
   * Total number of items to render. Set by totalItems.
   */
  private _totalItems: number = null;

  /**
   * Flag for asynchnronous reset requests. Resetting clears and reinserts
   * children in the range.
   */
  private _needsReset: boolean = false;

  /**
   * Flag for asynchnronous remeasure requests. Signals that all children
   * should be remeasured.
   */
  private _needsRemeasure: boolean = false;

  /**
   * Used to keep track of children that can be cleaned up after a range update.
   */
  private _active: Map<Child, number> = new Map();
  private _prevActive: Map<Child, number> = new Map();

  /**
   * Used for recycling purposes.
   */
  private _keyToChild: Map<Key|number, Child> = new Map();
  private _childToKey: WeakMap<Child, Key|number> = new WeakMap();

  /**
   * Used to keep track of measures by index.
   */
  private _indexToMeasure = {};
  private __incremental: boolean = false;

  /**
   * Used for tracking range changes.
   */
  private _prevNum: number;

  /**
   * Invoked at the end of each render cycle: children in the range are
   * measured, and their dimensions passed to this callback. Use it to layout
   * children as needed.
   */
  protected _measureCallback: (sizes: {[key: number]: ItemBox}) => void = null;

  /**
   * Number of children in the range. Set by num.
   * TODO @straversi: Consider renaming this. count? visibleElements?
   */
  protected _num: number = Infinity;

  /**
   * Index of the first child in the range, not necessarily the first visible child.
   * TODO @straversi: Consider renaming these.
   */
  protected _first: number = 0;

  /**
   * Index of the last child in the range.
   */
  protected _last: number = 0;

  /**
   * Previous first rendered index. Used to avoid unnecessary updates.
   */
  protected _prevFirst: number = 0;

  /**
   * Previous last rendered index. Used to avoid unnecessary updates.
   */
  protected _prevLast: number = 0;

  /**
   * Flag for asynchnronous render requests. Renders can be requested several
   * times before a render actually happens.
   */
  protected _pendingRender = null;

  /**
   * Containing element. Set by container.
   */
  protected _container: Element | ShadowRoot = null;

  /**
   * Children in the rendered order.
   */
  protected _ordered: Array<Child> = [];

  constructor(config) {
    if (config) {
      Object.assign(this, config);
    }
  }

  // API

  /**
   * The parent of all child nodes to be rendered.
   */
  get container(): Element | ShadowRoot {
    return this._container;
  }
  set container(container: Element | ShadowRoot) {
    if (container === this._container) {
      return;
    }

    if (this._container) {
      // Remove children from old container.
      this._ordered.forEach((child) => this._removeChild(child));
    }

    this._container = container;

    if (container) {
      // Insert children in new container.
      this._ordered.forEach((child) => this._insertBefore(child, null));
    } else {
      this._ordered.length = 0;
      this._active.clear();
      this._prevActive.clear();
    }
    this.requestReset();
  }

  /**
   * Invoked to create a child.
   * Override or set directly to control element creation.
   */
  get createElement(): (item: Item, index: number) => Child {
    return this._createElementFn;
  }
  set createElement(fn) {
    if (fn !== this._createElementFn) {
      this._createElementFn = fn;
      this._keyToChild.clear();
      this.requestReset();
    }
  }

  /**
   * Invoked to update a child.
   * Override or set directly to control element updates.
   */
  get updateElement(): (child: Child, item: Item, index: number) => void {
    return this._updateElementFn;
  }
  set updateElement(fn) {
    if (fn !== this._updateElementFn) {
      this._updateElementFn = fn;
      this.requestReset();
    }
  }

  /**
   * Invoked in place of removing a child from the DOM, so that it can be reused.
   * Override or set directly to prepare children for reuse.
   */
  get recycleElement(): (child: Child, index: number) => void {
    return this._recycleElementFn;
  }
  set recycleElement(fn) {
    if (fn !== this._recycleElementFn) {
      this._recycleElementFn = fn;
      this.requestReset();
    }
  }

  /**
   * Invoked to generate a key for an element.
   * Override or set directly to control how keys are generated for children.
   */
  get elementKey(): (index: number) => Key {
    return this._elementKeyFn;
  }
  set elementKey(fn) {
    if (fn !== this._elementKeyFn) {
      this._elementKeyFn = fn;
      this._keyToChild.clear();
      this.requestReset();
    }
  }

  /**
   * The index of the first child in the range.
   */
  get first(): number {
    return this._first;
  }
  set first(idx: number) {
    if (typeof idx !== 'number') {
      throw new Error('New value must be a number.');
    }

    const newFirst = Math.max(0, Math.min(idx, this.totalItems - this._num));
    if (newFirst !== this._first) {
      this._first = newFirst;
      this._scheduleRender();
    }
  }

  /**
   * The number of children in the range.
   */
  get num(): number {
    return this._num;
  }
  set num(n) {
    if (typeof n !== 'number') {
      throw new Error('New value must be a number.');
    }

    if (n !== this._num) {
      this._num = n;
      this.first = this._first;
      this._scheduleRender();
    }
  }

  /**
   * An array of data to be used to render child nodes.
   */
  get items(): Array<Item> {
    return this._items;
  }
  set items(items) {
    if (items !== this._items && Array.isArray(items)) {
      this._items = items;
      this.requestReset();
    }
  }

  /**
   * The total number of items, regardless of the range, that can be rendered
   * as child nodes.
   */
  get totalItems(): number {
    return (this._totalItems === null ? this._items.length : this._totalItems);
  }
  set totalItems(num: number) {
    if (typeof num !== 'number' && num !== null) {
      throw new Error('New value must be a number.');
    }

    // TODO(valdrin) should we check if it is a finite number?
    // Technically, Infinity would break Layout, not VirtualRepeater.
    if (num !== this._totalItems) {
      this._totalItems = num;
      this.first = this._first;
      this.requestReset();
    }
  }

  /**
   * TODO @straversi: Document this.
   */
  get _incremental(): boolean {
    return this.__incremental;
  }
  set _incremental(inc: boolean) {
    if (inc !== this.__incremental) {
      this.__incremental = inc;
      this._scheduleRender();
    }
  }

  /**
   * Invoke to request that all elements in the range be measured.
   */
  requestRemeasure() {
    this._needsRemeasure = true;
    this._scheduleRender();
  }

  // Core functionality

  protected _shouldRender(): boolean {
    return Boolean(this.container && this.createElement);
  }

  /**
   * Render at the next opportunity.
   */
  protected async _scheduleRender(): Promise<void> {
    if (!this._pendingRender) {
      this._pendingRender = true;
      await Promise.resolve();
      this._pendingRender = false;
      if (this._shouldRender()) {
        this._render();
      }
      // this._pendingRender = requestAnimationFrame(() => {
      //   this._pendingRender = null;
      //   if (this._shouldRender()) {
      //     this._render();
      //   }
      // });
    }
  }

  /**
   * Invoke to request that all elements in the range be updated.
   */
  private requestReset() {
    this._needsReset = true;
    this._scheduleRender();
  }

  /**
   * Returns those children that are about to be displayed and that require to
   * be positioned. If reset or remeasure has been triggered, all children are
   * returned.
   */
  private get _toMeasure(): {indices: Array<number>, children: Array<Child>} {
    return this._ordered.reduce((toMeasure, c, i) => {
      const idx = this._first + i;
      if (this._needsReset || this._needsRemeasure || idx < this._prevFirst ||
          idx > this._prevLast) {
        toMeasure.indices.push(idx);
        toMeasure.children.push(c);
      }
      return toMeasure;
    }, {indices: [], children: []});
  }

  /**
   * Measures each child bounds and builds a map of index/bounds to be passed
   * to the `_measureCallback`
   */
  private async _measureChildren({indices, children}): Promise<void> {
    await (new Promise((resolve) => {
      requestAnimationFrame(resolve);
    }));
    const pm = children.map((c) => this._measureChild(c));
    const mm = /** @type {{number: {width: number, height: number}}} */
        (pm.reduce((out, cur, i) => {
          out[indices[i]] = this._indexToMeasure[indices[i]] = cur;
          return out;
        }, {}));
    this._measureCallback(mm);
  }

  /**
   * Render items within the current range to the DOM.
   */
  protected async _render(): Promise<void> {
    const rangeChanged =
        this._first !== this._prevFirst || this._num !== this._prevNum;
    // Create/update/recycle DOM.
    if (rangeChanged || this._needsReset) {
      this._last =
          this._first + Math.min(this._num, this.totalItems - this._first) - 1;
      if (this._num || this._prevNum) {
        if (this._needsReset) {
          this._reset(this._first, this._last);
        } else {
          // Remove old children and insert new children without touching
          // shared children.
          this._discardHead();
          this._discardTail();
          this._addHead();
          this._addTail();
        }
      }
    }
    if (this._needsRemeasure || this._needsReset) {
      this._indexToMeasure = {};
    }
    // Retrieve DOM to be measured.
    // Do it right before cleanup and reset of properties.
    const shouldMeasure = this._num > 0 && this._measureCallback &&
        (rangeChanged || this._needsRemeasure || this._needsReset);
    const toMeasure = shouldMeasure ? this._toMeasure : null;

    // Cleanup.
    if (!this._incremental) {
      this._prevActive.forEach((idx, child) => this._unassignChild(child, idx));
      this._prevActive.clear();
    }
    // Reset internal properties.
    this._prevFirst = this._first;
    this._prevLast = this._last;
    this._prevNum = this._num;
    this._needsReset = false;
    this._needsRemeasure = false;

    // Notify render completed.
    this._didRender();
    // Measure DOM.
    if (toMeasure) {
      await this._measureChildren(toMeasure);
    }
  }

  /**
   * Invoked after DOM is updated, and before it gets measured.
   */
  protected _didRender() {
  }

  /**
   * Unassigns any children at indices lower than the start of the current
   * range.
   */
  private _discardHead() {
    const o = this._ordered;
    for (let idx = this._prevFirst; o.length && idx < this._first; idx++) {
      this._unassignChild(o.shift(), idx);
    }
  }

  /**
   * Unassigns any children at indices higher than the end of the current
   * range.
   */
  private _discardTail() {
    const o = this._ordered;
    for (let idx = this._prevLast; o.length && idx > this._last; idx--) {
      this._unassignChild(o.pop(), idx);
    }
  }

  /**
   * Assigns and inserts non-existent children from the current range with
   * indices lower than the start of the previous range.
   */
  private _addHead() {
    const start = this._first;
    const end = Math.min(this._last, this._prevFirst - 1);
    for (let idx = end; idx >= start; idx--) {
      const child = this._assignChild(idx);
      // Maintain dom order.
      this._insertBefore(child, this._firstChild);
      if (this.updateElement) {
        this.updateElement(child, this._items[idx], idx);
      }
      this._ordered.unshift(child);
    }
  }

  /**
   * Assigns and appends non-existent children from the current range with
   * indices higher than the end of the previous range.
   */
  private _addTail() {
    const start = Math.max(this._first, this._prevLast + 1);
    const end = this._last;
    for (let idx = start; idx <= end; idx++) {
      const child = this._assignChild(idx);
      // Maintain dom order.
      this._insertBefore(child, null);
      if (this.updateElement) {
        this.updateElement(child, this._items[idx], idx);
      }
      this._ordered.push(child);
    }
  }

  /**
   * Re-insert and update children in the given range.
   */
  private _reset(first: number, last: number) {
    // Swapping prevActive with active affects _assignChild.
    // Upon resetting, the current active children become potentially inactive.
    // _assignChild will remove a child from _prevActive if it is still active.
    const prevActive = this._active;
    this._active = this._prevActive;
    this._prevActive = prevActive;

    this._ordered.length = 0;
    let currentMarker = this._firstChild;
    for (let i = first; i <= last; i++) {
      const child = this._assignChild(i);
      this._ordered.push(child);

      if (currentMarker) {
        if (currentMarker === this._node(child)) {
          currentMarker = this._nextSibling(child);
        } else {
          this._insertBefore(child, currentMarker);
        }
      } else if (!this._childIsAttached(child)) {
        this._insertBefore(child, null);
      }

      if (this.updateElement) {
        this.updateElement(child, this._items[i], i);
      }
    }
  }

  /**
   * Instantiates, tracks, and returns the child at idx.
   * Prevents cleanup of children that already exist.
   * Returns the new child at idx.
   */
  private _assignChild(idx: number): Child {
    const key = this.elementKey ? this.elementKey(idx) : idx;
    let child;
    if (child = this._keyToChild.get(key)) {
      this._prevActive.delete(child);
    } else {
      child = this.createElement(this._items[idx], idx);
      this._keyToChild.set(key, child);
      this._childToKey.set(child, key);
    }
    this._showChild(child);
    this._active.set(child, idx);
    return child;
  }

  /**
   * Removes the child at idx, recycling it if possible.
   */
  private _unassignChild(child: Child, idx: number) {
    this._hideChild(child);
    if (this._incremental) {
      this._active.delete(child);
      this._prevActive.set(child, idx);
    } else {
      const key = this._childToKey.get(child);
      this._childToKey.delete(child);
      this._keyToChild.delete(key);
      this._active.delete(child);
      if (this.recycleElement) {
        this.recycleElement(child, idx);
      } else if (this._node(child).parentNode) {
        this._removeChild(child);
      }
    }
  }

  /**
   * Returns the node for the first child in the current range, if the node is
   * in the DOM.
   * TODO: Is this the right name?
   */
  get _firstChild(): Node {
    return this._ordered.length && this._childIsAttached(this._ordered[0]) ?
        this._node(this._ordered[0]) :
        null;
  }

  /**
   * Overridable abstractions for child manipulation
   */

  /**
   * Return the node for child.
   * Override if child !== child's node.
   */
  _node(child: Child): Node {
    return child;
  }

  /**
   * Returns the next node sibling of a child node.
   */
  _nextSibling(child: Child): Node {
    return child.nextSibling;
  }

  /**
   * Inserts child before referenceNode in the container.
   * Override to control child insertion.
   */
  _insertBefore(child: Child, referenceNode: Node) {
    this._container.insertBefore(child, referenceNode);
  }

  /**
   * Removes child from the DOM.
   * TODO @straversi: this will not work (_node should be called on child), but
   * is not currently being used or tested.
   */
  _removeChild(child: Child) {
    child.parentNode.removeChild(child);
  }

  /**
   * Returns whether the child's node is a child of the container
   * element.
   */
  _childIsAttached(child: Child): boolean {
    const node = this._node(child);
    return node && node.parentNode === this._container;
  }

  /**
   * Sets the display style of the given node to 'none'.
   */
  _hideChild(child: Child) {
    if (child instanceof HTMLElement) {
      child.style.display = 'none';
    }
  }

  /**
   * Sets the display style of the given node to null.
   */
  _showChild(child: Child) {
    if (child instanceof HTMLElement) {
      child.style.display = null;
    }
  }

  /**
   * Returns the width, height, and margins of the given child.
   * Override if child !== child's node.
   */
  _measureChild(child: Child): ItemBox {
    // offsetWidth doesn't take transforms in consideration, so we use
    // getBoundingClientRect which does.
    const {width, height} = child.getBoundingClientRect();
    return Object.assign({width, height}, getMargins(child));
  }
}

function getMargins(el): Margins {
  const style = window.getComputedStyle(el);
  return {
    marginTop: getMarginValue(style.marginTop),
    marginRight: getMarginValue(style.marginRight),
    marginBottom: getMarginValue(style.marginBottom),
    marginLeft: getMarginValue(style.marginLeft),
  };
}

function getMarginValue(value: string): number {
  const float = value ? parseFloat(value) : NaN;
  return Number.isNaN(float) ? 0 : float;
}
