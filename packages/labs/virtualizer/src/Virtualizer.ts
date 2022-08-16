/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import getResizeObserver from './polyfillLoaders/ResizeObserver.js';
import {
  ItemBox,
  Margins,
  Layout,
  ChildPositions,
  LayoutConstructor,
  LayoutSpecifier,
} from './layouts/shared/Layout.js';

export const virtualizerRef = Symbol('virtualizerRef');
const SIZER_ATTRIBUTE = 'virtualizer-sizer';

interface InternalRange {
  first: number;
  last: number;
  num: number;
  firstVisible: number;
  lastVisible: number;
}

interface Range {
  first: number;
  last: number;
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
    rangeChanged: RangeChangedEvent;
    visibilityChanged: VisibilityChangedEvent;
  }
}

export interface VirtualizerHostElement extends HTMLElement {
  [virtualizerRef]?: Virtualizer;
}

interface ScrollSize {
  height: number | null;
  width: number | null;
}

type ChildMeasurements = {[key: number]: ItemBox};

export interface ScrollElementIntoViewOptions extends ScrollIntoViewOptions {
  index: number;
}

type ScrollToOptionsWithoutBehavior = Omit<ScrollToOptions, 'behavior'>;
type ScrollElementIntoViewOptionsWithoutBehavior = Omit<
  ScrollElementIntoViewOptions,
  'behavior'
>;

export type PinOptions =
  | ScrollToOptionsWithoutBehavior
  | ScrollElementIntoViewOptionsWithoutBehavior
  | null;

export interface VirtualizerConfig {
  layout?: Layout | LayoutConstructor | LayoutSpecifier | null;

  pin?: PinOptions | null;

  /**
   * The parent of all child nodes to be rendered.
   */
  hostElement: VirtualizerHostElement;

  scroller?: boolean;
}

/**
 * Provides virtual scrolling boilerplate.
 *
 * Extensions of this class must set hostElement and layout.
 *
 * Extensions of this class must also override VirtualRepeater's DOM
 * manipulation methods.
 */
export class Virtualizer {
  private _benchmarkStart: number | null = null;
  /**
   * Whether the layout should receive an updated viewport size on the next
   * render.
   */
  // private _needsUpdateView: boolean = false;

  private _layout: Layout | null = null;

  private _clippingAncestors: HTMLElement[] = [];

  /**
   * Layout provides these values, we set them on _render().
   * TODO @straversi: Can we find an XOR type, usable for the key here?
   */
  private _scrollSize: ScrollSize | null = null;

  /**
   * Difference between scroll target's current and required scroll offsets.
   * Provided by layout.
   */
  private _scrollError: {left: number; top: number} | null = null;

  // private _correctingScrollError = false;

  /**
   * A list of the positions (top, left) of the children in the current range.
   */
  private _childrenPos: ChildPositions | null = null;

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

  private _scroller: Scroller | null = null;

  private _isScroller = false;

  private _sizer: HTMLElement | null = null;

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

  private _scrollEventListeners: (Element | Window)[] = [];
  private _scrollEventListenerOptions: AddEventListenerOptions = {
    passive: true,
  };

  // TODO (graynorton): Rethink, per longer comment below

  private _loadListener = this._childLoaded.bind(this);

  /**
   * Desired scroll position, as declaratively specified
   * via the `pin` property. May be expressed
   * as either top / left coordinates or the index of an
   * element to scroll into view
   */
  private _pin: PinOptions = null;

  /**
   * Index of element to scroll into view, plus scroll
   * behavior options, as imperatively specified via the
   * `scrollElementIntoView` method
   */
  private _scrollIntoViewDestination: ScrollElementIntoViewOptions | null =
    null;

  private _updateScrollIntoViewCoordinates:
    | ((coordinates: ScrollToOptionsWithoutBehavior) => void)
    | null = null;

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
  protected _measureCallback: ((sizes: ChildMeasurements) => void) | null =
    null;

  protected _measureChildOverride:
    | (<T>(element: Element, item: T) => ItemBox)
    | null = null;

  constructor(config: VirtualizerConfig) {
    if (!config) {
      throw new Error(
        'Virtualizer constructor requires a configuration object'
      );
    }
    if (config.hostElement) {
      this._init(config);
    } else {
      throw new Error(
        'Virtualizer configuration requires the "hostElement" property'
      );
    }
  }

  set items(items: Array<unknown> | undefined) {
    if (Array.isArray(items) && items !== this._items) {
      this._itemsChanged = true;
      this._items = items;
      this._schedule(this._updateLayout);
    }
  }

  _init(config: VirtualizerConfig) {
    this._isScroller = !!config.scroller;
    this._initHostElement(config);
    this._initLayout(config);
  }

  private async _initObservers() {
    this._mutationObserver = new MutationObserver(
      this._observeMutations.bind(this)
    );
    const ResizeObserver = await getResizeObserver();
    this._hostElementRO = new ResizeObserver(() =>
      this._hostElementSizeChanged()
    );
    this._childrenRO = new ResizeObserver(this._childrenSizeChanged.bind(this));
  }

  async _initLayout(config: VirtualizerConfig) {
    if (config.layout) {
      this.layout = config.layout;
    } else {
      this.layout = (await import('./layouts/flow.js')).FlowLayout;
    }
  }

  _initHostElement(config: VirtualizerConfig) {
    const hostElement = (this._hostElement = config.hostElement);
    this._applyVirtualizerStyles();
    hostElement[virtualizerRef] = this;
  }

  async connected() {
    await this._initObservers();
    const includeSelf = this._isScroller;
    this._clippingAncestors = getClippingAncestors(
      this._hostElement!,
      includeSelf
    );

    this._scroller = new Scroller(this, this._clippingAncestors[0]);

    this._schedule(this._updateLayout);
    this._observeAndListen();
  }

  _observeAndListen() {
    this._mutationObserver!.observe(this._hostElement!, {childList: true});
    this._mutationPromise = new Promise(
      (resolve) => (this._mutationPromiseResolver = resolve)
    );
    this._hostElementRO!.observe(this._hostElement!);
    this._scrollEventListeners.push(window);
    window.addEventListener('scroll', this, this._scrollEventListenerOptions);
    this._clippingAncestors.forEach((ancestor) => {
      ancestor.addEventListener(
        'scroll',
        this,
        this._scrollEventListenerOptions
      );
      this._scrollEventListeners.push(ancestor);
      this._hostElementRO!.observe(ancestor);
    });
    this._hostElementRO!.observe(this._scroller!.element);
    this._children.forEach((child) => this._childrenRO!.observe(child));
    this._scrollEventListeners.forEach((target) =>
      target.addEventListener('scroll', this, this._scrollEventListenerOptions)
    );
  }

  disconnected() {
    this._scrollEventListeners.forEach((target) =>
      target.removeEventListener(
        'scroll',
        this,
        this._scrollEventListenerOptions
      )
    );
    this._scrollEventListeners = [];
    this._clippingAncestors = [];
    this._scroller = this._scroller!.detach(this);
    this._mutationObserver!.disconnect();
    this._hostElementRO!.disconnect();
    this._childrenRO!.disconnect();
  }

  private _applyVirtualizerStyles() {
    const hostElement = this._hostElement!;
    // Would rather set these CSS properties on the host using Shadow Root
    // style scoping (and falling back to a global stylesheet where native
    // Shadow DOM is not available), but this Mobile Safari bug is preventing
    // that from working: https://bugs.webkit.org/show_bug.cgi?id=226195
    const style = hostElement.style as CSSStyleDeclaration & {contain: string};
    style.display = style.display || 'block';
    style.position = style.position || 'relative';
    style.contain = style.contain || 'size layout';

    if (this._isScroller) {
      style.overflow = style.overflow || 'auto';
      style.minHeight = style.minHeight || '150px';
    }
  }

  _getSizer() {
    const hostElement = this._hostElement!;
    if (!this._sizer) {
      // Use a pre-existing sizer element if provided (for better integration
      // with vDOM renderers)
      let sizer = hostElement.querySelector(
        `[${SIZER_ATTRIBUTE}]`
      ) as HTMLElement;
      if (!sizer) {
        sizer = document.createElement('div');
        sizer.setAttribute(SIZER_ATTRIBUTE, '');
        hostElement.appendChild(sizer);
      }
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
      sizer.setAttribute(SIZER_ATTRIBUTE, '');
      this._sizer = sizer;
    }
    return this._sizer;
  }

  // This will always actually return a layout instance,
  // but TypeScript wants the getter and setter types to be the same
  get layout(): Layout | LayoutConstructor | LayoutSpecifier | null {
    return this._layout;
  }

  // TODO (graynorton): Consider not allowing dynamic layout changes and
  // instead just creating a new Virtualizer instance when a layout
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
    } else {
      _layout = layout;
    }

    if (typeof _layout === 'function') {
      if (this._layout instanceof _layout) {
        if (_config) {
          this._layout!.config = _config;
        }
        return;
      } else {
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
      this._sizeHostElement(undefined);
      this._hostElement!.removeEventListener('load', this._loadListener, true);
    }

    this._layout = _layout as Layout | null;

    if (this._layout) {
      if (
        this._layout.measureChildren &&
        typeof this._layout.updateItemSizes === 'function'
      ) {
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
      const entries = performance.getEntriesByName(
        'uv-virtualizing',
        'measure'
      );
      const virtualizationTime = entries
        .filter(
          (e) => e.startTime >= this._benchmarkStart! && e.startTime < now
        )
        .reduce((t, m) => t + m.duration, 0);
      this._benchmarkStart = null;
      return {timeElapsed, virtualizationTime};
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
        mm[idx] = fn.call(
          this,
          child,
          this._items[idx] /*as unknown as object*/
        );
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
      this._rangeChanged = false;
      await this._mutationPromise;
    }
    this._children.forEach((child) => this._childrenRO!.observe(child));
    this._checkScrollIntoViewDestination(this._childrenPos);
    this._positionChildren(this._childrenPos);
    this._sizeHostElement(this._scrollSize);
    this._correctScrollError();
    if (this._benchmarkStart && 'mark' in window.performance) {
      window.performance.mark('uv-end');
    }
  }

  _updateLayout() {
    if (this._layout) {
      this._layout!.totalItems = this._items.length;
      if (this._pin !== null) {
        const {index, block} = this._pin as ScrollElementIntoViewOptions;
        if (index !== undefined) {
          this._layout!.pinnedItem = {index, block};
          this._pin = null;
        } else {
          const {top, left} = this._pin as ScrollToOptions;
          if (top !== undefined || left !== undefined) {
            this._layout!.pinnedCoordinates = {top, left};
            this._pin = null;
          }
        }
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
        window.performance.measure('uv-virtualizing', 'uv-start', 'uv-end');
      } catch (e) {
        console.warn('Error measuring performance data: ', e);
      }
      window.performance.mark('uv-start');
    }
    if (this._scroller!.correctingScrollError === false) {
      // This is a user-initiated scroll, so we unpin the layout
      this._layout?.unpin();
    }
    this._schedule(this._updateLayout);
  }

  handleEvent(event: CustomEvent) {
    switch (event.type) {
      case 'scroll':
        if (
          event.currentTarget === window ||
          this._clippingAncestors.includes(event.currentTarget as HTMLElement)
        ) {
          this._handleScrollEvent();
        }
        break;
      case 'scrollsizechange':
        this._scrollSize = event.detail;
        this._schedule(this._updateDOM);
        break;
      case 'scrollerrorchange':
        this._scrollError = event.detail;
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

  get _children(): Array<HTMLElement> {
    const arr = [];
    let next = this._hostElement!.firstElementChild as HTMLElement;
    while (next) {
      if (!next.hasAttribute(SIZER_ATTRIBUTE)) {
        arr.push(next);
      }
      next = next.nextElementSibling as HTMLElement;
    }
    return arr;
  }

  private _updateView() {
    const hostElement = this._hostElement;
    const scrollingElement = this._scroller?.element;
    const layout = this._layout;

    if (hostElement && scrollingElement && layout) {
      let top, left, bottom, right;

      const hostElementBounds = hostElement.getBoundingClientRect();

      top = 0;
      left = 0;
      bottom = window.innerHeight;
      right = window.innerWidth;

      for (const ancestor of this._clippingAncestors) {
        const ancestorBounds = ancestor.getBoundingClientRect();
        top = Math.max(top, ancestorBounds.top);
        left = Math.max(left, ancestorBounds.left);
        bottom = Math.min(bottom, ancestorBounds.bottom);
        right = Math.min(right, ancestorBounds.right);
      }

      const scrollingElementBounds = scrollingElement.getBoundingClientRect();
      // const domScroll = {
      //   left: scrollingElement.scrollLeft,
      //   top: scrollingElement.scrollTop
      // }

      // console.log('domScroll', domScroll);

      const offsetWithinScroller = {
        left: hostElementBounds.left - scrollingElementBounds.left,
        top: hostElementBounds.top - scrollingElementBounds.top,
      };

      const totalScrollSize = {
        width: scrollingElement.scrollWidth,
        height: scrollingElement.scrollHeight,
      };

      const scrollTop = top - hostElementBounds.top + hostElement.scrollTop;
      const scrollLeft = left - hostElementBounds.left + hostElement.scrollLeft;

      const height = Math.max(1, bottom - top);
      const width = Math.max(1, right - left);

      layout.viewportSize = {width, height};
      layout.viewportScroll = {top: scrollTop, left: scrollLeft};
      layout.totalScrollSize = totalScrollSize;
      layout.offsetWithinScroller = offsetWithinScroller;
    }
  }

  /**
   * Styles the host element so that its size reflects the
   * total size of all items.
   */
  private _sizeHostElement(size?: ScrollSize | null) {
    // Some browsers seem to crap out if the host element gets larger than
    // a certain size, so we clamp it here (this value based on ad hoc
    // testing in Chrome / Safari / Firefox Mac)
    const max = 8200000;
    const h = size && size.width !== null ? Math.min(max, size.width) : 0;
    const v = size && size.height !== null ? Math.min(max, size.height) : 0;

    if (this._isScroller) {
      this._getSizer().style.transform = `translate(${h}px, ${v}px)`;
    } else {
      const style = this._hostElement!.style;
      (style.minWidth as string | null) = h ? `${h}px` : '100%';
      (style.minHeight as string | null) = v ? `${v}px` : '100%';
    }
  }

  /**
   * Sets the top and left transform style of the children from the values in
   * pos.
   */
  private _positionChildren(pos: ChildPositions | null) {
    if (pos) {
      pos.forEach(({top, left, width, height, xOffset, yOffset}, index) => {
        const child = this._children[index - this._first];
        if (child) {
          child.style.position = 'absolute';
          child.style.boxSizing = 'border-box';
          child.style.transform = `translate(${left}px, ${top}px)`;
          if (width !== undefined) {
            child.style.width = width + 'px';
          }
          if (height !== undefined) {
            child.style.height = height + 'px';
          }
          (child.style.left as string | null) =
            xOffset === undefined ? null : xOffset + 'px';
          (child.style.top as string | null) =
            yOffset === undefined ? null : yOffset + 'px';
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
    this._rangeChanged =
      this._rangeChanged || this._first !== _first || this._last !== _last;
    this._visibilityChanged =
      this._visibilityChanged ||
      this._firstVisible !== _firstVisible ||
      this._lastVisible !== _lastVisible;
  }

  private _correctScrollError() {
    if (this._scrollError) {
      const {scrollTop, scrollLeft} = this._scroller!;
      const {top, left} = this._scrollError;
      this._scrollError = null;
      this._scroller!.correctScrollError({
        top: scrollTop - top,
        left: scrollLeft - left,
      });
    }
  }

  /**
   * Index and position of item to scroll to. The virtualizer will fix to that point
   * until the user scrolls.
   */
  public set pin(newValue: PinOptions) {
    this._pin = newValue;
    this._schedule(this._updateLayout);
  }

  public scrollElementIntoView(options: ScrollElementIntoViewOptions) {
    options.index = Math.min(options.index, this._items.length - 1);
    if (options.behavior === 'smooth') {
      const layout = this.layout as Layout;
      const coordinates = layout.getScrollIntoViewCoordinates(options);
      const {behavior} = options;
      this._updateScrollIntoViewCoordinates = this._scroller!.managedScrollTo(
        Object.assign(coordinates, {behavior}),
        () => layout.getScrollIntoViewCoordinates(options),
        () => (this._scrollIntoViewDestination = null)
      );
      this._scrollIntoViewDestination = options;
    } else {
      this.pin = options;
    }
  }

  /**
   * If we are smoothly scrolling to an element and the target element
   * is in the DOM, we update our scroll destination as needed
   */
  private _checkScrollIntoViewDestination(pos: ChildPositions | null) {
    const {index} = this._scrollIntoViewDestination || {};
    if (index && pos?.has(index)) {
      const layout = this._layout as Layout;
      this._updateScrollIntoViewCoordinates!(
        layout.getScrollIntoViewCoordinates(this._scrollIntoViewDestination!)
      );
    }
  }

  /**
   * Emits a rangechange event with the current first, last, firstVisible, and
   * lastVisible.
   */
  private _notifyRange() {
    this._hostElement!.dispatchEvent(
      new RangeChangedEvent({first: this._first, last: this._last})
    );
  }

  private _notifyVisibility() {
    this._hostElement!.dispatchEvent(
      new VisibilityChangedEvent({
        first: this._firstVisible,
        last: this._lastVisible,
      })
    );
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
      this._mutationPromise = new Promise(
        (resolve) => (this._mutationPromiseResolver = resolve)
      );
      this._mutationsObserved = false;
    }
  }

  // TODO (graynorton): Rethink how this works. Probably child loading is too specific
  // to have dedicated support for; might want some more generic lifecycle hooks for
  // layouts to use. Possibly handle measurement this way, too, or maybe that remains
  // a first-class feature?

  private _childLoaded() {}

  // This is the callback for the ResizeObserver that watches the
  // virtualizer's children. We land here at the end of every virtualizer
  // update cycle that results in changes to physical items, and we also
  // end up here if one or more children change size independently of
  // the virtualizer update cycle.
  private _childrenSizeChanged(changes: ResizeObserverEntry[]) {
    // Only measure if the layout requires it
    if (this._layout!.measureChildren) {
      for (const change of changes) {
        this._toBeMeasured.set(
          change.target as HTMLElement,
          change.contentRect
        );
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
    return (parentNode as ShadowRoot).host || null;
  }
  return null;
}

///

type retargetScrollCallback = () => ScrollToOptionsWithoutBehavior;
type endScrollCallback = () => void;

class Scroller {
  private static _instanceMap: WeakMap<HTMLElement | Window, Scroller> =
    new WeakMap();
  private _node: HTMLElement | Window | null = null;
  private _element: HTMLElement | null = null;
  private _originalScrollTo:
    | typeof HTMLElement.prototype.scrollTo
    | typeof window.scrollTo
    | null = null;
  private _clients: Array<unknown> = [];
  private _retarget: retargetScrollCallback | null = null;
  private _end: endScrollCallback | null = null;
  private _destination: ScrollToOptions | null = null;

  constructor(client: unknown, element?: HTMLElement) {
    const node = element || window;
    const instance = Scroller._instanceMap.get(node);
    if (instance) {
      instance._attach(client);
      return instance;
    } else {
      this._checkForArrival = this._checkForArrival.bind(this);
      this._updateManagedScrollTo = this._updateManagedScrollTo.bind(this);
      this.scrollTo = this.scrollTo.bind(this);
      this._node = node;
      if (element) {
        this._element = element;
      }
      this._originalScrollTo = node.scrollTo;
      this._attach(client);
    }
  }

  public correctingScrollError = false;

  public get destination() {
    return this._destination;
  }

  public get element() {
    return (
      this._element || document.scrollingElement || document.documentElement
    );
  }

  public get scrolling() {
    return this.destination !== null;
  }

  public get scrollTop() {
    return this._element?.scrollTop || window.scrollY;
  }

  public get scrollLeft() {
    return this._element?.scrollLeft || window.scrollX;
  }

  public get scrollHeight() {
    return (
      this._element?.scrollHeight ||
      (document.scrollingElement || document.documentElement).scrollHeight
    );
  }

  public get scrollWidth() {
    return (
      this._element?.scrollWidth ||
      (document.scrollingElement || document.documentElement).scrollWidth
    );
  }

  public get maxScrollTop() {
    return this.scrollHeight - this.element.getBoundingClientRect().height;
  }

  public get maxScrollLeft() {
    return this.scrollWidth - this.element.getBoundingClientRect().width;
  }

  public scrollTo(options: ScrollToOptions): void;
  public scrollTo(x: number, y: number): void;
  public scrollTo(p1: ScrollToOptions | number, p2?: number): void;
  public scrollTo(p1: ScrollToOptions | number, p2?: number) {
    const options: ScrollToOptions =
      typeof p1 === 'number' && typeof p2 === 'number'
        ? {left: p1, top: p2}
        : (p1 as ScrollToOptions);
    this._scrollTo(options);
  }

  private _nativeScrollTo(options: ScrollToOptions) {
    this._originalScrollTo!.bind(this._element || window)(options);
  }

  private _scrollTo(
    options: ScrollToOptions,
    retarget: retargetScrollCallback | null = null,
    end: endScrollCallback | null = null
  ) {
    if (this._end !== null) {
      this._end();
    }
    if (options.behavior === 'smooth') {
      this._setDestination(options);
      this._retarget = retarget;
      this._end = end;
    } else {
      this._resetScrollState();
    }
    this._nativeScrollTo(options);
  }

  private _setDestination(options: ScrollToOptions) {
    let {top, left} = options;
    top =
      top === undefined
        ? undefined
        : Math.max(0, Math.min(top, this.maxScrollTop));
    left =
      left === undefined
        ? undefined
        : Math.max(0, Math.min(left, this.maxScrollLeft));
    if (
      this.destination !== null &&
      left === this.destination.left &&
      top === this.destination.top
    ) {
      return false;
    }
    this._destination = {top, left, behavior: 'smooth'};
    return true;
  }

  private _resetScrollState() {
    this._destination = null;
    this._retarget = null;
    this._end = null;
  }

  private _updateManagedScrollTo(coordinates: ScrollToOptionsWithoutBehavior) {
    if (this.destination) {
      if (this._setDestination(coordinates)) {
        this._nativeScrollTo(this.destination);
      }
    }
  }

  public managedScrollTo(
    options: ScrollToOptions,
    retarget: retargetScrollCallback,
    end: endScrollCallback
  ) {
    this._scrollTo(options, retarget, end);
    return this._updateManagedScrollTo;
  }

  public correctScrollError(coordinates: ScrollToOptionsWithoutBehavior) {
    this.correctingScrollError = true;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => (this.correctingScrollError = false))
    );
    // Correct the error
    this._nativeScrollTo(coordinates);
    // Then, if we were headed for a specific destination, we continue scrolling:
    // First, we update our target destination, if applicable...
    if (this._retarget) {
      this._setDestination(this._retarget());
    }
    // Then we go ahead and resume scrolling
    const {destination} = this;
    if (destination) {
      this._nativeScrollTo(destination);
    }
  }

  private _checkForArrival() {
    if (this.destination !== null) {
      const {scrollTop, scrollLeft} = this;
      let {top, left} = this.destination;
      top = Math.min(top || 0, this.maxScrollTop);
      left = Math.min(left || 0, this.maxScrollLeft);
      const topDiff = Math.abs(top - scrollTop);
      const leftDiff = Math.abs(left - scrollLeft);
      // We check to see if we've arrived at our destination.
      if (topDiff < 1 && leftDiff < 1) {
        if (this._end) {
          this._end();
        }
        this._resetScrollState();
      }
    }
  }

  public detach(client: unknown) {
    this._clients = this._clients.splice(this._clients.indexOf(client), 1);
    if (this._clients.length === 0) {
      this._node!.scrollTo = this._originalScrollTo!;
      this._node!.removeEventListener('scroll', this._checkForArrival);
    }
    return null;
  }

  private _attach(client: unknown) {
    this._clients.push(client);
    if (this._clients.length === 1) {
      this._node!.scrollTo = this.scrollTo;
      this._node!.addEventListener('scroll', this._checkForArrival);
    }
  }
}

///

function getElementAncestors(el: HTMLElement, includeSelf = false) {
  const ancestors = [];
  let parent = includeSelf ? el : (getParentElement(el) as HTMLElement);
  while (parent !== null) {
    ancestors.push(parent);
    parent = getParentElement(parent) as HTMLElement;
  }
  return ancestors;
}

function getClippingAncestors(el: HTMLElement, includeSelf = false) {
  return getElementAncestors(el, includeSelf).filter(
    (a) => getComputedStyle(a).overflow !== 'visible'
  );
}
