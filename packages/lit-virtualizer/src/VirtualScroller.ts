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

export interface VirtualizerHostElement extends HTMLElement {
  [scrollerRef]?: VirtualScroller
}

type VerticalScrollSize = {height: number};
type HorizontalScrollSize = {width: number};
type ScrollSize = VerticalScrollSize | HorizontalScrollSize;

type ChildMeasurements = {[key: number]: ItemBox};

export type ScrollToIndexValue = {index: number, position?: string} | null;

export interface VirtualizerConfig {
  layout?: Layout | LayoutConstructor | LayoutSpecifier;

  /**
   * The parent of all child nodes to be rendered.
   */
  hostElement: VirtualizerHostElement;

  containerElement?: HTMLElement;

  mutationObserverTarget?: HTMLElement;
}

/**
 * Provides virtual scrolling boilerplate.
 *
 * Extensions of this class must set hostElement, layout, and scrollTarget.
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

  private _clippingAncestors: Element[] = [];

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
   * The HTMLElement that hosts the virtualizer. Set by hostElement.
   */
  protected _hostElement?: VirtualizerHostElement;

  protected _containerElement?: HTMLElement;

  protected _mutationObserverTarget?: HTMLElement;

  /**
   * Resize observer attached to hostElement.
   */
  private _hostElementRO: ResizeObserver | null = null;

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
   * Index of the first child in the range, not necessarily the first visible child.
   * TODO @straversi: Consider renaming these.
   */
  protected _first = -1;

  /**
   * Index of the last child in the range.
   */
  protected _last = -1;

  /**
   * Index of the first item intersecting the viewport.
   */
  private _firstVisible = -1;

  /**
   * Index of the last item intersecting the viewport.
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

  constructor(config: VirtualizerConfig) {
    if (!config) {
      throw new Error('VirtualScroller constructor requires a configuration object');
    }
    if (config.hostElement) {
      this._init(config);
    }
    else {
      throw new Error('VirtualScroller configuration requires the "hostElement" property');
    }
  }

  async _init(config: VirtualizerConfig) {
    await this._initResizeObservers();
    this._initHostElement(config);
    this._initScrollListeners();
    this._initLayout(config);
  }

  async _initLayout(config: VirtualizerConfig) {
    if (config.layout) {
      this.layout = config.layout;
    }
    else {
      this.layout = (await import('./layouts/FlowLayout')).FlowLayout;
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
   * The element hosting the virtualizer and containing all of its child elements
   */
  // get hostElement(): VirtualizerHostElement {
  //   return this._hostElement!;
  // }

  _initHostElement(config: VirtualizerConfig) {
    const hostElement = (this._hostElement = config.hostElement);
    const containerElement = (this._containerElement = config.containerElement || hostElement);
    const mutationObserverTarget = (this._mutationObserverTarget = config.mutationObserverTarget || hostElement);
    // this._applyVirtualizerStyles();
    this._clippingAncestors = getClippingAncestors(containerElement);
    this._schedule(this._updateLayout);
    // this._hostElementRO!.observe(hostElement);
    this._mutationObserver!.observe(mutationObserverTarget, { childList: true });
    this._mutationPromise = new Promise(resolve => this._mutationPromiseResolver = resolve);
    hostElement[scrollerRef] = this;
  }

  // private _applyVirtualizerStyles() {
  //   const hostElement = this._hostElement!;
  //   if (nativeShadowDOM) {
  //     const root = hostElement.shadowRoot || hostElement.attachShadow({mode: 'open'});
  //     const slot = root.querySelector('slot:not([name])') || document.createElement('slot');
  //     const sheet = document.createElement('style');
  //     sheet.textContent = virtualizerStyles(':host', '::slotted(*)');
  //     root.appendChild(sheet);
  //     root.appendChild(slot);
  //   }
  //   else {
  //     attachGlobalStylesheet();
  //     hostElement.classList.add(CONTAINER_CLASSNAME);
  //   }
  // }

  // This will always actually return a layout instance,
  // but TypeScript wants the getter and setter types to be the same
  get layout(): Layout | LayoutConstructor | LayoutSpecifier | null {
    return this._layout;
  }

  // TODO (graynorton): Consider not allowing dynamic layout changes and
  // instead just creating a new VirtualScroller instance when a layout
  // change is desired. Might simplify quite a bit.
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
      this._sizeContainer(undefined);
      this._hostElement!.removeEventListener('load', this._loadListener, true);
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
      if (this._layout.listenForChildLoadEvents) {
        this._hostElement!.addEventListener('load', this._loadListener, true);
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

  _initScrollListeners() {
    window.addEventListener('scroll', this, {passive: true});
    this._clippingAncestors.forEach(ancestor => ancestor.addEventListener('scroll', this, {passive: true}));
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
      this._layout!.totalItems = this._items.length;
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
        if (event.currentTarget === window || this._clippingAncestors.includes(event.currentTarget as Element)) {
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
    if (this._hostElementRO === null) {
      const ResizeObserver = await getResizeObserver();
      this._hostElementRO = new ResizeObserver(
        () => this._hostElementSizeChanged()
      );
      this._childrenRO =
        new ResizeObserver(this._childrenSizeChanged.bind(this));
      this._mutationObserver = new MutationObserver(this._observeMutations.bind(this));
    }
  }

  get _children(): Array<HTMLElement> {
    const arr = [];
    let next = this._hostElement!.firstElementChild as HTMLElement;
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
    const containerElement = this._containerElement!;
    const layout = this._layout!;

    let top, left, bottom, right, scrollTop, scrollLeft;

    const containerElementBounds = containerElement.getBoundingClientRect();

    top = 0
    left = 0;
    bottom = window.innerHeight;
    right = window.innerWidth;

    for (let ancestor of this._clippingAncestors) {
      const ancestorBounds = ancestor.getBoundingClientRect();
      top = Math.max(top, ancestorBounds.top);
      left = Math.max(left, ancestorBounds.left);
      bottom = Math.min(bottom, ancestorBounds.bottom);
      right = Math.min(right, ancestorBounds.right);
    }
    scrollTop = top - containerElementBounds.top;
    scrollLeft = left - containerElementBounds.left;
    
    const height = Math.max(1, bottom - top);
    const width = Math.max(1, right - left);

    layout.viewportSize = {width, height};
    layout.viewportScroll = {top: scrollTop, left: scrollLeft};
  }

  /**
   * Styles the container so that its size reflects the
   * total size of all items.
   */
  private _sizeContainer(size?: ScrollSize | null) {
    // Some browsers seem to crap out if the container gets larger than
    // a certain size, so we clamp it here (this value based on ad hoc
    // testing in Firefox)
    const max = 8850000;
    const h = size && (size as HorizontalScrollSize).width ? Math.min(max, (size as HorizontalScrollSize).width) : 0;
    const v = size && (size as VerticalScrollSize).height ? Math.min(max, (size as VerticalScrollSize).height) : 0;
    const style = this._containerElement!.style;
    (style.minWidth as string | null) = h ? `${h}px` : null;
    (style.minHeight as string | null) = v ? `${v}px` : null;
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
          (child.style.left as string | null) = xOffset === undefined ? null : xOffset + 'px';
          (child.style.top as string | null) = yOffset === undefined ? null : yOffset + 'px';
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
    const target = this._clippingAncestors[0];
    if (target) {
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
    this._hostElement!.dispatchEvent(new RangeChangedEvent({ first: this._first, last: this._last }));
  }

  private _notifyVisibility() {
    this._hostElement!.dispatchEvent(new VisibilityChangedEvent({ first: this._firstVisible, last: this._lastVisible }));
  }

  /**
   * Render and update the view at the next opportunity with the given
   * hostElement size.
   */
  private _hostElementSizeChanged() {
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

// TODO (graynorton): Deal with iframes?
function getParentElement(el: Element) {
  if (el.parentElement !== null) {
    return el.parentElement;
  }
  const parentNode = el.parentNode;
  if (parentNode && parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    return (parentNode as ShadowRoot).host;
  }
  return null;
}

function getElementAncestors(el: Element) {
  const ancestors = [];
  let parent = getParentElement(el);
  while(parent !== null) {
    ancestors.push(parent);
    parent = getParentElement(parent);
  }
  return ancestors;
}

function getClippingAncestors(el: Element) {
  return getElementAncestors(el)
    .filter(a => getComputedStyle(a).overflow !== 'visible');
}

///

// // TODO (graynorton): Make a better test that doesn't know anything about ShadyDOM?
// declare global {
//   interface Window {
//       ShadyDOM?: any;
//   }
// }
// let nativeShadowDOM = 'attachShadow' in Element.prototype && (!('ShadyDOM' in window) || !window['ShadyDOM'].inUse);

// const CONTAINER_CLASSNAME = 'lit-virtualizer-container';
// let globalStylesheet: HTMLStyleElement | null = null;

// function virtualizerStyles(containerSel: string, childSel: string): string {
//   return `
//     ${containerSel} {
//       position: relative;
//       contain: strict;
//     }
//     ${childSel} {
//       box-sizing: border-box;
//     }`;
// }

// function attachGlobalStylesheet() {
//   if (!globalStylesheet) {
//     globalStylesheet = document.createElement('style');
//     globalStylesheet.textContent = virtualizerStyles(`.${CONTAINER_CLASSNAME}`,`.${CONTAINER_CLASSNAME} > *`);
//     document.head.appendChild(globalStylesheet);
//   }
// }