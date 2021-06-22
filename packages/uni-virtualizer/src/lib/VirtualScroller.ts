import getResizeObserver from './polyfillLoaders/ResizeObserver.js';
import { ItemBox, Margins, Layout, Positions, LayoutConstructor, LayoutSpecifier } from './layouts/Layout.js';

export const scrollerRef = Symbol('scrollerRef');

interface InternalRange {
  first: number;
  last: number;
  num: number;
  remeasure: boolean;
  stable: boolean;
  firstVisible: number;
  lastVisible: number;
}

interface Range {
  first: number,
  last: number
}

export class RangeChangedEvent extends Event {
  static eventName = 'rangeChanged';

  first: number;
  last: number;

  constructor(range: Range) {
    super(RangeChangedEvent.eventName, {bubbles: true});
    this.first = range.first;
    this.last = range.last;
  }
}

export class VisibilityChangedEvent extends Event {
  static eventName = 'visibilityChanged';

  first: number;
  last: number;

  constructor(range: Range) {
    super(VisibilityChangedEvent.eventName, {bubbles: true});
    this.first = range.first;
    this.last = range.last;
  }
}

declare global {
  interface HTMLElementEventMap {
    'rangeChanged': RangeChangedEvent;
    'visibilityChanged': VisibilityChangedEvent;
  }
}

export interface ContainerElement extends HTMLElement {
  [scrollerRef]?: VirtualScroller
}

type VerticalScrollSize = {height: number};
type HorizontalScrollSize = {width: number};
type ScrollSize = VerticalScrollSize | HorizontalScrollSize;

type ChildMeasurements = {[key: number]: ItemBox};

export type ScrollToIndexValue = {index: number, position?: string} | null;

export interface VirtualScrollerConfig {
  layout?: Layout | LayoutConstructor | LayoutSpecifier;

  /**
   * An element that receives scroll events for the virtual scroller.
   */
  scrollTarget?: Element | Window;

  /**
   * The parent of all child nodes to be rendered.
   */
  container: HTMLElement | ShadowRoot;
}

/**
 * Provides virtual scrolling boilerplate.
 *
 * Extensions of this class must set container, layout, and scrollTarget.
 *
 * Extensions of this class must also override VirtualRepeater's DOM
 * manipulation methods.
 */
export class VirtualScroller {
  private _benchmarkStart: number | null = null;
  /**
   * Whether the layout should receive an updated viewport size on the next
   * render.
   */
  // private _needsUpdateView: boolean = false;

  private _layout: Layout | null = null;

  /**
   * The element that generates scroll events and defines the container
   * viewport. Set by scrollTarget.
   */
  private _scrollTarget?: Element | Window;

  /**
   * A sentinel element that sizes the container when it is a scrolling
   * element. This ensures the scroll bar accurately reflects the total
   * size of the list.
   */
  private _sizer: HTMLElement | null = null;

  /**
   * Layout provides these values, we set them on _render().
   * TODO @straversi: Can we find an XOR type, usable for the key here?
   */
  private _scrollSize: ScrollSize | null = null;

  /**
   * Difference between scroll target's current and required scroll offsets.
   * Provided by layout.
   */
  private _scrollErr: {left: number, top: number} | null = null;

  /**
   * A list of the positions (top, left) of the children in the current range.
   */
  private _childrenPos: Array<{top: number, left: number}> | null = null;

  // TODO: (graynorton): type
  private _childMeasurements: ChildMeasurements | null = null;

  private _toBeMeasured: Map<HTMLElement, unknown> = new Map();

  private _rangeChanged = true;

  private _itemsChanged = true;

  private _visibilityChanged = true;

  /**
   * Containing element. Set by container.
   */
  protected _container?: ContainerElement;

  /**
   * Size of the container.
   */
  private _containerSize: {width: number, height: number} | null = null;

  /**
   * Resize observer attached to container.
   */
  private _containerRO: ResizeObserver | null = null;

  /**
   * Resize observer attached to children.
   */
  private _childrenRO: ResizeObserver | null = null;

  private _mutationObserver: MutationObserver | null = null;
  private _mutationPromise: Promise<void> | null = null;
  private _mutationPromiseResolver: Function | null = null;
  private _mutationsObserved = false;

  // TODO (graynorton): Rethink, per longer comment below

  private _loadListener = this._childLoaded.bind(this);

  /**
   * Index and position of item to scroll to.
   */
  private _scrollToIndex: ScrollToIndexValue = null;

  /**
   * Items to render. Set by items.
   */
  private _items: Array<unknown> = [];

  /**
   * Total number of items to render. Set by totalItems.
   */
  private _totalItems?: number;

  /**
   * Index of the first child in the range, not necessarily the first visible child.
   * TODO @straversi: Consider renaming these.
   */
  protected _first = -1;

  /**
   * Index of the last child in the range.
   */
  protected _last = -1;

  /**
   * Index of the first item intersecting the container element.
   */
  private _firstVisible = -1;

  /**
   * Index of the last item intersecting the container element.
   */
  private _lastVisible = -1;

  protected _scheduled = new WeakSet();

  /**
   * Invoked at the end of each render cycle: children in the range are
   * measured, and their dimensions passed to this callback. Use it to layout
   * children as needed.
   */
   protected _measureCallback: ((sizes: ChildMeasurements) => void) | null = null;

   protected _measureChildOverride: ((element: Element, item: unknown) => ItemBox) | null = null;

  constructor(config: VirtualScrollerConfig) {
    if (!config) {
      throw new Error('VirtualScroller constructor requires a configuration object');
    }
    if (config.container) {
      this._init(config);
    }
    else {
      throw new Error('VirtualScroller configuration requires the "container" property');
    }
  }

  async _init(config: VirtualScrollerConfig) {
    await this._initResizeObservers();
    this._initContainer(config);
    this._initScrollTarget(config);
    this._initLayout(config);
  }

  async _initLayout(config: VirtualScrollerConfig) {
    if (config.layout) {
      this.layout = config.layout;
    }
    else {
      this.layout = (await import('./layouts/Layout1d')).Layout1d;
    }
  }

  set items(items: Array<unknown> | undefined) {
    if (Array.isArray(items) && items !== this._items) {
      this._itemsChanged = true;
      this._items = items;
      this._schedule(this._updateLayout);
    }
  }

  /**
   * The total number of items, regardless of the range, that can be rendered
   * as child nodes.
   */
  // Never actually returns undefined, but TS requires getter and setter types to be the same
  get totalItems(): number | undefined {
    return (this._totalItems === undefined ? this._items.length : this._totalItems);
  }

  set totalItems(num: number | undefined) {
    if (typeof num !== 'number' && num !== undefined) {
      throw new Error('The value of totalItems must be a number.');
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
  // Won't ever return a ShadowRoot, but TypeScript wants setter and getter
  // types to be the same
  get container(): ContainerElement | ShadowRoot | undefined {
    return this._container;
  }

  _initContainer(config: VirtualScrollerConfig) {
    const { container } = config;
    // Consider document fragments as shadowRoots.
    const newContainer =
        (container && container.nodeType === Node.DOCUMENT_FRAGMENT_NODE) ?
        (container as ShadowRoot).host as ContainerElement :
        container as ContainerElement;

    this._schedule(this._updateLayout);

    // First time container was setup, add listeners only now.
    // TODO (graynorton): Don't think we want this.
    // addEventListener('scroll', this, {passive: true});

    this._container = newContainer;

    // Would rather set these CSS properties on the host using Shadow Root
    // style scoping (and falling back to a global stylesheet where native
    // Shadow DOM is not available), but this Mobile Safari bug is preventing
    // that from working: https://bugs.webkit.org/show_bug.cgi?id=226195
    const style = newContainer.style as CSSStyleDeclaration & { contain: string };
    style.display = style.display || 'block';
    style.position = style.position || 'relative';
    style.overflow = style.overflow || 'auto';
    style.contain = style.contain || 'strict';

    this._containerRO!.observe(newContainer);
    this._mutationObserver!.observe(newContainer, { childList: true });
    this._mutationPromise = new Promise(resolve => this._mutationPromiseResolver = resolve);

    newContainer[scrollerRef] = this;
  }

  // This will always actually return a layout instance,
  // but TypeScript wants the getter and setter types to be the same
  get layout(): Layout | LayoutConstructor | LayoutSpecifier | null {
    return this._layout;
  }

  set layout(layout: Layout | LayoutConstructor | LayoutSpecifier | null) {
    if (this._layout === layout) {
      return;
    }

    let _layout: LayoutConstructor | Layout | null = null;
    let _config: object = {};

    if (typeof layout === 'object') {
      if ((layout as LayoutSpecifier).type !== undefined) {
        _layout = (layout as LayoutSpecifier).type;
        // delete (layout as LayoutSpecifier).type;
      }
      _config = layout as object;
    }
    else {
      _layout = layout;
    }

    if (typeof _layout === 'function') {
      if (this._layout instanceof _layout) {
        if (_config) {
          this._layout!.config = _config;
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
      // Reset container size so layout can get correct viewport size.
      if (this._container) {
        this._sizeContainer(undefined);
        this._container.removeEventListener('load', this._loadListener, true);
      }
    }

    this._layout = _layout as Layout | null;

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
      if (this._container && this._layout.listenForChildLoadEvents) {
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
    }
  }

  stopBenchmarking() {
    if (this._benchmarkStart !== null) {
      const now = window.performance.now();
      const timeElapsed = now - this._benchmarkStart;
      const entries = performance.getEntriesByName('uv-virtualizing', 'measure');
      const virtualizationTime = entries
        .filter(e => e.startTime >= this._benchmarkStart! && e.startTime < now)
        .reduce((t, m) => t + m.duration, 0);
      this._benchmarkStart = null;
      return { timeElapsed, virtualizationTime };
    }
    return null;
  }

  private _measureChildren(): void {
    const mm: ChildMeasurements = {};
    const children = this._children;
    const fn = this._measureChildOverride || this._measureChild;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const idx = this._first + i;
      if (this._itemsChanged || this._toBeMeasured.has(child)) {
        mm[idx] = fn.call(this, child, this._items[idx] /*as unknown as object*/);
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
  get scrollTarget(): Element | Window | undefined {
    return this._scrollTarget;
  }
  _initScrollTarget(config: VirtualScrollerConfig) {
    const target = this._scrollTarget = config.scrollTarget || window;
    target.addEventListener('scroll', this, {passive: true});
    if (target === this._container) {
      this._sizer = this._sizer || this._createContainerSizer();
      this._container!.insertBefore(this._sizer, this._container!.firstChild);
    }
  }

  /**
   * Index and position of item to scroll to. The scroller will fix to that point
   * until the user scrolls.
   */
  set scrollToIndex(newValue: ScrollToIndexValue) {
    this._scrollToIndex = newValue;
    this._schedule(this._updateLayout);
  }

  protected async _schedule(method: Function): Promise<void> {
    if (!this._scheduled.has(method)) {
      this._scheduled.add(method);
      await Promise.resolve();
      this._scheduled.delete(method);
      method.call(this);
    }
  }

  async _updateDOM() {
    const {_rangeChanged, _itemsChanged} = this;
    if (this._visibilityChanged) {
      this._notifyVisibility();
      this._visibilityChanged = false;
    }
    if (_rangeChanged || _itemsChanged) {
      this._notifyRange();
      await this._mutationPromise;
    }
    this._children.forEach((child) => this._childrenRO!.observe(child));
    this._positionChildren(this._childrenPos!);
    this._sizeContainer(this._scrollSize);
    if (this._scrollErr) {
      this._correctScrollError(this._scrollErr);
      this._scrollErr = null;
    }
    if (this._benchmarkStart && 'mark' in window.performance) {
      window.performance.mark('uv-end');
    }
  }

  _updateLayout() {
    if (this._layout) {
      this._layout!.totalItems = this.totalItems!;
      if (this._scrollToIndex !== null) {
        this._layout!.scrollToIndex(this._scrollToIndex.index, this._scrollToIndex!.position!);
        this._scrollToIndex = null;
      }
      this._updateView();
      if (this._childMeasurements !== null) {
        // If the layout has been changed, we may have measurements but no callback
        if (this._measureCallback) {
          this._measureCallback(this._childMeasurements);
        }
        this._childMeasurements = null;
      }
      this._layout!.reflowIfNeeded(this._itemsChanged);
      if (this._benchmarkStart && 'mark' in window.performance) {
        window.performance.mark('uv-end');
      }  
    }
  }

  private _handleScrollEvent() {
    if (this._benchmarkStart && 'mark' in window.performance) {
      try {
        window.performance.measure(
          'uv-virtualizing',
          'uv-start',
          'uv-end'
        );
      } catch(e) {
        console.warn('Error measuring performance data: ', e);
      }
      window.performance.mark('uv-start');
    }
    this._schedule(this._updateLayout);
  }

  handleEvent(event: CustomEvent) {
    switch (event.type) {
      case 'scroll':
        if (event.currentTarget === this._scrollTarget) {
          this._handleScrollEvent();
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
        (entries: ResizeObserverEntry[]) => this._containerSizeChanged(entries[0].contentRect));
      this._childrenRO =
        new ResizeObserver(this._childrenSizeChanged.bind(this));
      this._mutationObserver = new MutationObserver(this._observeMutations.bind(this));
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

  get _children(): Array<HTMLElement> {
    const arr = [];
    let next = this.container!.firstElementChild as HTMLElement;
    while (next) {
      // Skip our spacer. TODO (graynorton): Feels a bit hacky. Anything better?
      if (next.id !== 'uni-virtualizer-spacer') {
        arr.push(next);
      }
      next = next.nextElementSibling as HTMLElement;
    }
    return arr;
  }

  private _updateView() {
    if (!this.container || !this._container || !this._layout) {
      return;
    }
    let width, height, top, left;
    if (this._scrollTarget === this._container && this._containerSize !== null) {
      width = this._containerSize.width;
      height = this._containerSize.height;
      left = this._container.scrollLeft;
      top = this._container.scrollTop;
    } else {
      const containerBounds = this._container.getBoundingClientRect();
      const scrollBounds = this._scrollTarget == window
          ? {
            top: containerBounds.top + window.pageYOffset,
            left: containerBounds.left + window.pageXOffset,
            width: window.innerWidth,
            height: window.innerHeight
          }
          : (this._scrollTarget as Element).getBoundingClientRect();

      const scrollerWidth = scrollBounds.width;
      const scrollerHeight = scrollBounds.height;
      const xMin = Math.max(
          0, Math.min(scrollerWidth, containerBounds.left - scrollBounds.left));
      const yMin = Math.max(
          0, Math.min(scrollerHeight, containerBounds.top - scrollBounds.top));
      // TODO (graynorton): Direction is intended to be a layout-level concept, not a scroller-level concept,
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
  private _sizeContainer(size?: ScrollSize | null) {
    if (this._scrollTarget === this._container) {
      const left = size && (size as HorizontalScrollSize).width ? (size as HorizontalScrollSize).width - 1 : 0;
      const top = size && (size as VerticalScrollSize).height ? (size as VerticalScrollSize).height - 1 : 0;
      if (this._sizer) {
        this._sizer.style.transform = `translate(${left}px, ${top}px)`;
      }
    } else {
      if (this._container) {
        const style = this._container.style;
        (style.minWidth as string | null) = size && (size as HorizontalScrollSize).width ? (size as HorizontalScrollSize).width + 'px' : null;
        (style.minHeight as string | null) = size && (size as VerticalScrollSize).height ? (size as VerticalScrollSize).height + 'px' : null;  
      }
    }
  }

  /**
   * Sets the top and left transform style of the children from the values in
   * pos.
   */
  private _positionChildren(pos: Array<Positions>) {
    if (pos) {
      const children = this._children;
      Object.keys(pos).forEach((key) => {
        const idx = (key as unknown as number) - this._first;
        const child = children[idx];
        if (child) {
          const {top, left, width, height, xOffset, yOffset} = pos[key as unknown as number];
          child.style.position = 'absolute';
          child.style.boxSizing = 'border-box';
          child.style.transform = `translate(${left}px, ${top}px)`;
          if (width !== undefined) {
            child.style.width = width + 'px';
          }
          if (height !== undefined) {
            child.style.height = height + 'px';
          }
          if (xOffset !== undefined) {
            child.style.left = `${xOffset}px`;
          }
          if (yOffset !== undefined) {
            child.style.top = `${yOffset}px`;
          }
        }
      });  
    }
  }

  private async _adjustRange(range: InternalRange) {
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
    if (this._scrollTarget !== window) {
      const target = this._scrollTarget as Element;
      target.scrollTop -= err.top;
      target.scrollLeft -= err.left;
    } else {
      window.scroll(window.pageXOffset - err.left, window.pageYOffset - err.top);
    }
  }

  /**
   * Emits a rangechange event with the current first, last, firstVisible, and
   * lastVisible.
   */
  private _notifyRange() {
    this._container!.dispatchEvent(new RangeChangedEvent({ first: this._first, last: this._last }));
  }

  private _notifyVisibility() {
    this._container!.dispatchEvent(new VisibilityChangedEvent({ first: this._firstVisible, last: this._lastVisible }));
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
      this._mutationPromiseResolver!();
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

  // This is the callback for the ResizeObserver that watches the
  // scroller's children. We land here at the end of every scroller
  // update cycle that results in changes to physical items, and we also
  // end up here if one or more children change size independently of
  // the scroller update cycle.
  private _childrenSizeChanged(changes: ResizeObserverEntry[]) {
    // Only measure if the layout requires it
    if (this._layout!.measureChildren) {
      for (const change of changes) {
        this._toBeMeasured.set(change.target as HTMLElement, change.contentRect);
      }
      this._measureChildren();
    }
    // If this is the end of an update cycle, we need to reset some
    // internal state. This should be a harmless no-op if we're handling
    // an out-of-cycle ResizeObserver callback, so we don't need to
    // distinguish between the two cases.
    this._itemsChanged = false;
    this._rangeChanged = false;
  }
}

function getMargins(el: Element): Margins {
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