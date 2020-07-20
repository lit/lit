import getResizeObserver from './polyfillLoaders/ResizeObserver.js';
import { ItemBox, Margins, Type, Layout, LayoutConfig } from './layouts/Layout.js';

export const scrollerRef = Symbol('scrollerRef');

// TODO (graynorton): Make a better test that doesn't know anything about ShadyDOM?
declare global {
  interface Window {
      ShadyDOM?: any;
  }
}
let nativeShadowDOM = 'attachShadow' in Element.prototype && (!('ShadyDOM' in window) || !window['ShadyDOM'].inUse);

const HOST_CLASSNAME = 'uni-virtualizer-host';
let globalContainerStylesheet: HTMLStyleElement = null;

interface Range {
  first: number;
  last: number;
  num: number;
  remeasure: boolean;
  stable: boolean;
  firstVisible: number;
  lastVisible: number;
}

function containerStyles(hostSel: string, childSel: string): string {
  return `
    ${hostSel} {
      display: block;
      position: relative;
      contain: strict;
      height: 150px;
      overflow: auto;
    }
    ${childSel} {
      box-sizing: border-box;
    }`;
}

function attachGlobalContainerStylesheet() {
  if (!globalContainerStylesheet) {
    globalContainerStylesheet = document.createElement('style');
    globalContainerStylesheet.textContent = containerStyles(`.${HOST_CLASSNAME}`, `.${HOST_CLASSNAME} > *`);
    document.head.appendChild(globalContainerStylesheet);
  }
}

// export const RangeChangeEvent = "rangeChanged";
export type RangeChangeEvent = {
  first: number;
  last: number;
  firstVisible: number;
  lastVisible: number;
};

// // inform compiler of the as24 custom events
// declare global {
//   interface DocumentEventMap {
//     'rangeChanged': CustomEvent<RangeChangeEvent>;
//   }
// }

// export class RangeChangeEvent extends Event {
//   first: number;
//   last: number;
//   firstVisible: number;
//   lastVisible: number;

//   constructor(type, init) {
//     super(type, init);
//     this.first = Math.floor(init.first || 0);
//     this.last = Math.floor(init.last || 0);
//     this.firstVisible = Math.floor(init.firstVisible || 0);
//     this.lastVisible = Math.floor(init.lastVisible || 0);
//   }
// }

// TODO (graynorton): Import this from somewhere upstream
interface VirtualScrollerConfig {
  layout?: Layout | Type<Layout> | LayoutConfig;

  /**
   * An element that receives scroll events for the virtual scroller.
   */
  scrollTarget: Element | Window;

  /**
   * The parent of all child nodes to be rendered.
   */
  container: Element | ShadowRoot;
}

/**
 * Provides virtual scrolling boilerplate.
 *
 * Extensions of this class must set container, layout, and scrollTarget.
 *
 * Extensions of this class must also override VirtualRepeater's DOM
 * manipulation methods.
 */
export class VirtualScroller<Item, Child extends HTMLElement> {
  private _benchmarkStart = null;
  private _openMeasure = false;
  /**
   * Whether the layout should receive an updated viewport size on the next
   * render.
   */
  // private _needsUpdateView: boolean = false;

  private _layout: Layout = null;

  /**
   * The element that generates scroll events and defines the container
   * viewport. Set by scrollTarget.
   */
  private _scrollTarget: Element | null = null;

  /**
   * A sentinel element that sizes the container when it is a scrolling
   * element. This ensures the scroll bar accurately reflects the total
   * size of the list.
   */
  private _sizer: HTMLElement = null;

  /**
   * Layout provides these values, we set them on _render().
   * TODO @straversi: Can we find an XOR type, usable for the key here?
   */
  private _scrollSize: {height: number} | {width: number} = null;

  /**
   * Difference between scroll target's current and required scroll offsets.
   * Provided by layout.
   */
  private _scrollErr: {left: number, top: number} = null;

  /**
   * A list of the positions (top, left) of the children in the current range.
   */
  private _childrenPos: Array<{top: number, left: number}> = null;

  // TODO: (graynorton): type
  private _childMeasurements: any = null;

  private _toBeMeasured: Map<HTMLElement, any> = new Map();

  private _rangeChanged: boolean = true;

  private _visibilityChanged: boolean = true;

  /**
   * Containing element. Set by container.
   */
  protected _container: Element | ShadowRoot = null;

  /**
   * The parent of all child nodes to be rendered. Set by container.
   */
  private _containerElement: Element = null;

  /**
   * Keep track of original inline style of the container, so it can be
   * restored when container is changed.
   */
  private _containerInlineStyle = null;

  /**
   * Keep track of original container stylesheet, so it can be restored
   * when container is changed.
   */
  private _containerStylesheet = null;

  /**
   * Size of the container.
   */
  private _containerSize: {width: number, height: number} = null;

  /**
   * Resize observer attached to container.
   */
  private _containerRO: ResizeObserver = null;

  /**
   * Resize observer attached to children.
   */
  private _childrenRO: ResizeObserver = null;

  private _mutationObserver: MutationObserver = null;
  private _mutationPromise: Promise<void> = null;
  private _mutationPromiseResolver: Function = null;
  private _mutationsObserved: boolean = false;

  // TODO (graynorton): Rethink, per longer comment below

  private _loadListener = this._childLoaded.bind(this);

  /**
   * Index and position of item to scroll to.
   */
  private _scrollToIndex: {index: number, position?: string} = null;

  /**
   * Items to render. Set by items.
   */
  private _items: Array<Item> = [];

  /**
   * Total number of items to render. Set by totalItems.
   */
  private _totalItems: number = null;

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
   * Index of the first item intersecting the container element.
   */
  private _firstVisible: number;

  /**
   * Index of the last item intersecting the container element.
   */
  private _lastVisible: number;

  protected _scheduled = new WeakSet();

  /**
   * Invoked at the end of each render cycle: children in the range are
   * measured, and their dimensions passed to this callback. Use it to layout
   * children as needed.
   */
  protected _measureCallback: (sizes: {[key: number]: ItemBox}) => void = null;

  protected _measureChildOverride: (element: Element, item: object) => object = null;

  constructor(config?: VirtualScrollerConfig) {
    this._first = -1;
    this._last = -1;

    if (config) {
      Object.assign(this, config);
    }
  }

  set items(items) {
    if (items !== this._items) {
      this._items = items;
      this._schedule(this._updateLayout);
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
      this._schedule(this._updateLayout);
    }
  }

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
      // TODO (graynorton): Decide whether we'd rather fire an event to clear
      // the range and let the renderer take care of removing the DOM children
      this._children.forEach(child => child.parentNode.removeChild(child));
    }

    this._container = container;

    this._schedule(this._updateLayout);

    this._initResizeObservers().then(() => {
        const oldEl = this._containerElement;
        // Consider document fragments as shadowRoots.
        const newEl =
            (container && container.nodeType === Node.DOCUMENT_FRAGMENT_NODE) ?
            (container as ShadowRoot).host :
            container as Element;
        if (oldEl === newEl) {
          return;
        }
  
        this._containerRO.disconnect();
        this._containerSize = null;
  
        if (oldEl) {
          if (this._containerInlineStyle) {
            oldEl.setAttribute('style', this._containerInlineStyle);
          } else {
            oldEl.removeAttribute('style');
          }
          this._containerInlineStyle = null;
          if (oldEl === this._scrollTarget) {
            oldEl.removeEventListener('scroll', this, {passive: true} as EventListenerOptions);
            this._sizer && this._sizer.remove();
          }
          oldEl.removeEventListener('load', this._loadListener, true);

          this._mutationObserver.disconnect();
        } else {
          // First time container was setup, add listeners only now.
          addEventListener('scroll', this, {passive: true});
        }
  
        this._containerElement = newEl;
  
        if (newEl) {
          this._containerInlineStyle = newEl.getAttribute('style') || null;
          this._applyContainerStyles();
          if (newEl === this._scrollTarget) {
            this._sizer = this._sizer || this._createContainerSizer();
            this._container.insertBefore(this._sizer, this._container.firstChild);
          }
          this._schedule(this._updateLayout);
          this._containerRO.observe(newEl);
          this._mutationObserver.observe(newEl, { childList: true });
          this._mutationPromise = new Promise(resolve => this._mutationPromiseResolver = resolve);
  
          if (this._layout && this._layout.listenForChildLoadEvents) {
            newEl.addEventListener('load', this._loadListener, true);
          }
        }
      });  
  }

  // This will always actually return a layout instance,
  // but TypeScript wants the getter and setter types to be the same
  get layout(): Layout | Type<Layout> | LayoutConfig {
    return this._layout;
  }

  set layout(layout: Layout | Type<Layout> | LayoutConfig) {
    if (this._layout === layout) {
      return;
    }

    let _layout, _config;

    if (typeof layout === 'object') {
      if ((layout as LayoutConfig).type !== undefined) {
        _layout = (layout as LayoutConfig).type;
        delete (layout as LayoutConfig).type;
      }
      _config = layout;
    }
    else {
      _layout = layout;
    }

    if (typeof _layout === 'function') {
      if (this._layout instanceof _layout) {
        if (_config) {
          this._layout.config = _config;
        }
        return;
      }
      else {
        _layout = new _layout(_config);
      }
    }

    if (this._layout) {
      this._measureCallback = null;
      this._measureChildOverride = null;
      this._layout.removeEventListener('scrollsizechange', this);
      this._layout.removeEventListener('scrollerrorchange', this);
      this._layout.removeEventListener('itempositionchange', this);
      this._layout.removeEventListener('rangechange', this);
      delete this.container[scrollerRef];
      this.container.removeEventListener('load', this._loadListener, true);
      // Reset container size so layout can get correct viewport size.
      if (this._containerElement) {
        this._sizeContainer(undefined);
      }
    }

    this._layout = _layout;

    if (this._layout) {
      if (this._layout.measureChildren && typeof this._layout.updateItemSizes === 'function') {
        if (typeof this._layout.measureChildren === 'function') {
          this._measureChildOverride = this._layout.measureChildren;
        }
        this._measureCallback = this._layout.updateItemSizes.bind(this._layout);
      }
      this._layout.addEventListener('scrollsizechange', this);
      this._layout.addEventListener('scrollerrorchange', this);
      this._layout.addEventListener('itempositionchange', this);
      this._layout.addEventListener('rangechange', this);
      this._container[scrollerRef] = this;
      if (this._layout.listenForChildLoadEvents) {
        this._container.addEventListener('load', this._loadListener, true);
      }
      this._schedule(this._updateLayout);
    }
  }

  // TODO (graynorton): Rework benchmarking so that it has no API and
  // instead is always on except in production builds
  startBenchmarking() {
    if (this._benchmarkStart === null) {
      this._benchmarkStart = window.performance.now();
      this._openMeasure = false;
    }
  }

  stopBenchmarking() {
    if (this._benchmarkStart !== null) {
      const timeElapsed = window.performance.now() - this._benchmarkStart;
      const entries = performance.getEntriesByName('uv-virtualizing', 'measure');
      // debugger;
      const virtualizationTime = entries.reduce((t, m) => t + m.duration, 0);
      this._benchmarkStart = null;
      this._openMeasure = false;
      // performance.clearMarks('uv-start');
      // performance.clearMarks('uv-end');
      // performance.clearMarks('uv-virtualizing');
      return { timeElapsed, virtualizationTime };
    }
    return null;
  }

  private _measureChildren(): void {
    const mm = {};
    const children = this._children;
    const fn = this._measureChildOverride || this._measureChild;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const idx = this._first + i;
      if (this._toBeMeasured.has(child)) {
        mm[idx] = fn.call(this, child, this._items[idx]);
      }
    }
    this._childMeasurements = mm;
    this._schedule(this._updateLayout);
    this._toBeMeasured.clear();
  }

  /**
   * Returns the width, height, and margins of the given child.
   */
  _measureChild(element: Element): ItemBox {
    // offsetWidth doesn't take transforms in consideration, so we use
    // getBoundingClientRect which does.
    const {width, height} = element.getBoundingClientRect();
    return Object.assign({width, height}, getMargins(element));
  }


  /**
   * The element that generates scroll events and defines the container
   * viewport. The value `null` (default) corresponds to `window` as scroll
   * target.
   */
  get scrollTarget(): Element | Window | null {
    return this._scrollTarget;
  }
  set scrollTarget(target: Element | Window | null) {
    // Consider window as null.
    if (target === window) {
      target = null;
    }
    if (this._scrollTarget === target) {
      return;
    }
    this._sizeContainer(undefined);
    if (this._scrollTarget) {
      this._scrollTarget.removeEventListener('scroll', this, {passive: true} as EventListenerOptions);
      if (this._sizer && this._scrollTarget === this._containerElement) {
        this._sizer.remove();
      }
    }

    this._scrollTarget = target as (Element | null);

    if (target) {
      target.addEventListener('scroll', this, {passive: true});
      if (target === this._containerElement) {
        this._sizer = this._sizer || this._createContainerSizer();
        this._container.insertBefore(this._sizer, this._container.firstChild);
      }
    }
  }

  /**
   * Index and position of item to scroll to. The scroller will fix to that point
   * until the user scrolls.
   */
  set scrollToIndex(newValue: {index: number, position?: string}) {
    this._scrollToIndex = newValue;
    this._schedule(this._updateLayout);
  }

  protected async _schedule(method): Promise<void> {
    if (!this._scheduled.has(method)) {
      this._scheduled.add(method);
      await Promise.resolve();
      this._scheduled.delete(method);
      method.call(this);
    }
  }

  async _updateDOM() {
    const {_rangeChanged} = this;
    if (this._visibilityChanged) {
      this._notifyVisibility();
      this._visibilityChanged = false;
    }
    if (_rangeChanged) {
      this._notifyRange();
      this._rangeChanged = false;
      await this._mutationPromise;
    }
    if (this._layout.measureChildren) {
      this._children.forEach((child) => this._childrenRO.observe(child));
    }
    this._positionChildren(this._childrenPos);
    this._sizeContainer(this._scrollSize);
    if (this._scrollErr) {
      this._correctScrollError(this._scrollErr);
      this._scrollErr = null;
    }
    if (this._benchmarkStart && 'mark' in window.performance) {
      window.performance.mark('uv-end');
      this._openMeasure = true;
    }
  }

  _updateLayout() {
    this._layout.totalItems = this._totalItems;
    if (this._scrollToIndex !== null) {
      this._layout.scrollToIndex(this._scrollToIndex.index, this._scrollToIndex.position);
      this._scrollToIndex = null;
    }
    this._updateView();
    if (this._childMeasurements !== null) {
      this._measureCallback(this._childMeasurements);
      this._childMeasurements = null;
    }
    this._layout.reflowIfNeeded();
  }

  private _awaitingScrollFrame = false;

  private _handleScrollEvent() {
    if (!this._scrollTarget || event.target === this._scrollTarget) {
      if (this._benchmarkStart && 'mark' in window.performance) {
        if (this._openMeasure) {
          window.performance.measure(
            'uv-virtualizing',
            'uv-start',
            'uv-end'
          );
          this._openMeasure = false;      
        }
        window.performance.mark('uv-start');
        // this._openMeasure = true;
      }
      this._schedule(this._updateLayout);
      this._awaitingScrollFrame = false;
    }
  }

  handleEvent(event) {
    switch (event.type) {
      case 'scroll':
        if (!this._awaitingScrollFrame) {
          requestAnimationFrame(() => this._handleScrollEvent());
          this._awaitingScrollFrame = true;
        }
        break;
      case 'scrollsizechange':
        this._scrollSize = event.detail;
        this._schedule(this._updateDOM);
        break;
      case 'scrollerrorchange':
        this._scrollErr = event.detail;
        this._schedule(this._updateDOM);
        break;
      case 'itempositionchange':
        this._childrenPos = event.detail;
        this._schedule(this._updateDOM);
        break;
      case 'rangechange':
        this._adjustRange(event.detail);
        this._schedule(this._updateDOM);
        break;
      default:
        console.warn('event not handled', event);
    }
  }

  private async _initResizeObservers() {
    if (this._containerRO === null) {
      const ResizeObserver = await getResizeObserver();
      this._containerRO = new ResizeObserver(
        (entries) => this._containerSizeChanged(entries[0].contentRect));
      this._childrenRO =
        new ResizeObserver(this._childrenSizeChanged.bind(this));
      this._mutationObserver = new MutationObserver(this._observeMutations.bind(this));
    }
  }

  private _applyContainerStyles() {
    if (nativeShadowDOM) {
      if (this._containerStylesheet === null) {
        const sheet = (this._containerStylesheet = document.createElement('style'));
        sheet.textContent = containerStyles(':host', '::slotted(*)');
      }
      const root = this._containerElement.shadowRoot || this._containerElement.attachShadow({mode: 'open'});
      const slot = root.querySelector('slot:not([name])');
      root.appendChild(this._containerStylesheet);
      if (!slot) {
        root.appendChild(document.createElement('slot'));
      }
    }
    else {
      attachGlobalContainerStylesheet();
      if (this._containerElement) {
        this._containerElement.classList.add(HOST_CLASSNAME);
      }
    }
  }

  private _createContainerSizer(): HTMLDivElement {
    const sizer = document.createElement('div');
    // When the scrollHeight is large, the height of this element might be
    // ignored. Setting content and font-size ensures the element has a size.
    Object.assign(sizer.style, {
      position: 'absolute',
      margin: '-2px 0 0 0',
      padding: 0,
      visibility: 'hidden',
      fontSize: '2px',
    });
    sizer.innerHTML = '&nbsp;';
    sizer.id = 'uni-virtualizer-spacer';
    return sizer;
  }

  /**
   * TODO: Rename _ordered to _children?
   */
  get _children(): Array<Child> {
    const arr = [];
    let next = this.container.firstElementChild;
    if (next) {
      // TODO (graynorton): Hack: skip the first child, which is our spacer
      if (next.id === 'uni-virtualizer-spacer') {
        next = next.nextElementSibling;
      }
      while (next) {
        arr.push(next);
        next = next.nextElementSibling;
      }
    }
    return arr;
  }

  private _updateView() {
    if (!this.container || !this._containerElement || !this._layout) {
      return;
    }
    let width, height, top, left;
    if (this._scrollTarget === this._containerElement && this._containerSize !== null) {
      width = this._containerSize.width;
      height = this._containerSize.height;
      left = this._containerElement.scrollLeft;
      top = this._containerElement.scrollTop;
    } else {
      const containerBounds = this._containerElement.getBoundingClientRect();
      const scrollBounds = this._scrollTarget ?
          this._scrollTarget.getBoundingClientRect() :
          {
            top: containerBounds.top + window.pageYOffset,
            left: containerBounds.left + window.pageXOffset,
            width: innerWidth,
            height: innerHeight
          };
      const scrollerWidth = scrollBounds.width;
      const scrollerHeight = scrollBounds.height;
      const xMin = Math.max(
          0, Math.min(scrollerWidth, containerBounds.left - scrollBounds.left));
      const yMin = Math.max(
          0, Math.min(scrollerHeight, containerBounds.top - scrollBounds.top));
      // TODO: Direction is intended to be a layout-level concept, not a scroller-level concept,
      // so this feels like a factoring problem
      const xMax = this._layout.direction === 'vertical' ?
          Math.max(
              0,
              Math.min(
                  scrollerWidth, containerBounds.right - scrollBounds.left)) :
          scrollerWidth;
      const yMax = this._layout.direction === 'vertical' ?
          scrollerHeight :
          Math.max(
              0,
              Math.min(
                  scrollerHeight, containerBounds.bottom - scrollBounds.top));
      width = xMax - xMin;
      height = yMax - yMin;
      left = Math.max(0, -(containerBounds.left - scrollBounds.left));
      top = Math.max(0, -(containerBounds.top - scrollBounds.top));
    }
    this._layout.viewportSize = {width, height};
    this._layout.viewportScroll = {top, left};
  }

  /**
   * Styles the _sizer element or the container so that its size reflects the
   * total size of all items.
   */
  private _sizeContainer(size) {
    if (this._scrollTarget === this._containerElement) {
      const left = size && size.width ? size.width - 1 : 0;
      const top = size && size.height ? size.height - 1 : 0;
      if (this._sizer) {
        this._sizer.style.transform = `translate(${left}px, ${top}px)`;
      }
    } else {
      if (this._containerElement) {
        const style = (this._containerElement as HTMLElement).style;
        style.minWidth = size && size.width ? size.width + 'px' : null;
        style.minHeight = size && size.height ? size.height + 'px' : null;  
      }
    }
  }

  /**
   * Sets the top and left transform style of the children from the values in
   * pos.
   */
  private _positionChildren(pos: Array<{top: number, left: number, width?: number, height?: number}>) {
    if (pos) {
      const children = this._children;
      Object.keys(pos).forEach((key) => {
        const idx = (key as unknown as number) - this._first;
        const child = children[idx];
        if (child) {
          const {top, left, width, height} = pos[key];
          child.style.position = 'absolute';
          child.style.transform = `translate(${left}px, ${top}px)`;
          if (width !== undefined) {
            child.style.width = width + 'px';
          }
          if (height !== undefined) {
            child.style.height = height + 'px';
          }
        }
      });  
    }
  }

  private async _adjustRange(range: Range) {
    const {_first, _last, _firstVisible, _lastVisible} = this;
    this._first = range.first;
    this._last = range.last;
    this._firstVisible = range.firstVisible;
    this._lastVisible = range.lastVisible;
    this._rangeChanged = (
      this._rangeChanged ||
      this._first !== _first ||
      this._last !== _last
    );
    this._visibilityChanged = (
      this._visibilityChanged ||
      this._firstVisible !== _firstVisible ||
      this._lastVisible !== _lastVisible
    );
  }

  private _correctScrollError(err: {top: number, left: number}) {
    if (this._scrollTarget) {
      this._scrollTarget.scrollTop -= err.top;
      this._scrollTarget.scrollLeft -= err.left;
    } else {
      window.scroll(window.pageXOffset - err.left, window.pageYOffset - err.top);
    }
  }

  /**
   * Emits a rangechange event with the current first, last, firstVisible, and
   * lastVisible.
   */
  private _notifyRange() {
    // TODO (graynorton): Including visibility here for backward compat, but 
    // may decide to remove at some point. The rationale for separating is that
    // range change events are mainly intended for "internal" consumption by the
    // renderer, whereas visibility change events are mainly intended for "external"
    // consumption by application code.
    this._container.dispatchEvent(
        new CustomEvent('rangeChanged', {detail:{
          first: this._first,
          last: this._last,
          firstVisible: this._firstVisible,
          lastVisible: this._lastVisible,
        }})
    );
  }

  private _notifyVisibility() {
    this._container.dispatchEvent(
        new CustomEvent('visibilityChanged', {detail:{
          first: this._first,
          last: this._last,
          firstVisible: this._firstVisible,
          lastVisible: this._lastVisible,
        }})
    );
  }

  /**
   * Render and update the view at the next opportunity with the given
   * container size.
   */
  private _containerSizeChanged(size: {width: number, height: number}) {
    const {width, height} = size;
    this._containerSize = {width, height};
    this._schedule(this._updateLayout);
  }

  private async _observeMutations() {
    if (!this._mutationsObserved) {
      this._mutationsObserved = true;
      this._mutationPromiseResolver();
      this._mutationPromise = new Promise(resolve => this._mutationPromiseResolver = resolve);
      this._mutationsObserved = false;
    }
  }

  // TODO (graynorton): Rethink how this works. Probably child loading is too specific
  // to have dedicated support for; might want some more generic lifecycle hooks for
  // layouts to use. Possibly handle measurement this way, too, or maybe that remains
  // a first-class feature?

  private _childLoaded() {
    // this.requestRemeasure();
  }

  private _childrenSizeChanged(changes) {
    for (let change of changes) {
      this._toBeMeasured.set(change.target, change.contentRect);
    }
    this._measureChildren();
    this._schedule(this._updateLayout);
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