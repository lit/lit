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
  ChildMeasurements,
  LayoutConstructor,
  LayoutSpecifier,
  Size,
  InternalRange,
  MeasureChildFunction,
  ScrollToCoordinates,
  BaseLayoutConfig,
} from './layouts/shared/Layout.js';
import {RangeChangedEvent, VisibilityChangedEvent} from './events.js';

export const virtualizerRef = Symbol('virtualizerRef');
const SIZER_ATTRIBUTE = 'virtualizer-sizer';

declare global {
  interface HTMLElementEventMap {
    rangeChanged: RangeChangedEvent;
    visibilityChanged: VisibilityChangedEvent;
  }
}

export interface VirtualizerHostElement extends HTMLElement {
  [virtualizerRef]?: Virtualizer;
}

export interface VirtualizerChildElementProxy {
  scrollIntoView: (options?: ScrollIntoViewOptions) => void;
}

interface ScrollElementIntoViewOptions extends ScrollIntoViewOptions {
  index: number;
}

type LayoutInstanceValue = Layout | null;
export type LayoutConfigValue =
  | LayoutInstanceValue
  | LayoutConstructor
  | LayoutSpecifier
  | BaseLayoutConfig
  | undefined;

let DEFAULT_LAYOUT: LayoutConstructor | null = null;
export function setDefaultLayout(ctor: LayoutConstructor) {
  DEFAULT_LAYOUT = ctor;
}

export interface VirtualizerConfig {
  layout?: LayoutConfigValue;

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

  private _layout: LayoutInstanceValue = null;

  private _clippingAncestors: HTMLElement[] = [];

  /**
   * Layout provides these values, we set them on _render().
   * TODO @straversi: Can we find an XOR type, usable for the key here?
   */
  private _scrollSize: Size | null = null;

  /**
   * Difference between scroll target's current and required scroll offsets.
   * Provided by layout.
   */
  private _scrollError: {left: number; top: number} | null = null;

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
   * Index of element to scroll into view, plus scroll
   * behavior options, as imperatively specified via
   * `element(index).scrollIntoView()`
   */
  private _scrollIntoViewTarget: ScrollElementIntoViewOptions | null = null;

  private _updateScrollIntoViewCoordinates:
    | ((coordinates: ScrollToCoordinates) => void)
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

  protected _measureChildOverride: MeasureChildFunction | null = null;

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
    this.layout = config.layout;
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

  async _fetchDefaultLayout(layoutConfig: LayoutConfigValue) {
    const {instance, ctor} = this._parseLayoutConfig(layoutConfig);
    if (instance === undefined && ctor === undefined) {
      await import('./layouts/flow.js');
    }
    this.layout = layoutConfig || {};
  }

  _parseLayoutConfig(layoutConfig?: LayoutConfigValue) {
    let instance: Layout | undefined;
    let ctor: LayoutConstructor | undefined;
    let config: BaseLayoutConfig | undefined;
    let isNull = false;
    if (layoutConfig === null) {
      isNull = true;
    } else {
      if (layoutConfig !== undefined) {
        if (typeof layoutConfig === 'object') {
          if ((layoutConfig as Layout).isVirtualizerLayoutInstance) {
            instance = layoutConfig as Layout;
          } else if (
            typeof (layoutConfig as LayoutSpecifier).type === 'function'
          ) {
            ctor = (layoutConfig as LayoutSpecifier).type as LayoutConstructor;
            const copy = {...(layoutConfig as LayoutSpecifier)} as {
              type?: LayoutConstructor;
            };
            delete copy.type;
            config = copy as BaseLayoutConfig;
          } else {
            config = layoutConfig as BaseLayoutConfig;
          }
        } else if (typeof layoutConfig === 'function') {
          ctor = layoutConfig as LayoutConstructor;
        }
      }
    }
    return {instance, ctor, config, isNull};
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
    this._rejectLayoutCompletePromise('disconnected');
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
  get layout(): Layout | null {
    return this._layout;
  }

  // TODO (graynorton): Consider not allowing dynamic layout changes and
  // instead just creating a new Virtualizer instance when a layout
  // change is desired. Might simplify quite a bit.
  set layout(layoutConfig: LayoutConfigValue) {
    const {instance, ctor, config, isNull} =
      this._parseLayoutConfig(layoutConfig);

    if (!instance) {
      let newInstance: Layout | null;
      if (isNull) {
        newInstance = null;
      } else if (ctor || DEFAULT_LAYOUT) {
        const verifiedCtor = (ctor || DEFAULT_LAYOUT)!;
        if (this._layout instanceof verifiedCtor) {
          this._layout.config = config;
          return;
        } else {
          newInstance = new (ctor || DEFAULT_LAYOUT)!(config);
        }
      } else {
        this._fetchDefaultLayout(layoutConfig);
        return;
      }

      if (this._layout) {
        this._measureCallback = null;
        this._measureChildOverride = null;
        this._layout.removeEventListener('scrollsizechange', this);
        this._layout.removeEventListener('scrollerrorchange', this);
        this._layout.removeEventListener('itempositionchange', this);
        this._layout.removeEventListener('rangechange', this);
        this._sizeHostElement(undefined);
        this._hostElement!.removeEventListener(
          'load',
          this._loadListener,
          true
        );
      }

      this._layout = newInstance;

      if (this._layout) {
        if (
          this._layout.measureChildren &&
          typeof this._layout.updateItemSizes === 'function'
        ) {
          if (typeof this._layout.measureChildren === 'function') {
            this._measureChildOverride = this._layout.measureChildren;
          }
          this._measureCallback = this._layout.updateItemSizes.bind(
            this._layout
          );
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
    this._checkScrollIntoViewTarget(this._childrenPos);
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

      const ancestorBounds = this._clippingAncestors.map((ancestor) =>
        ancestor.getBoundingClientRect()
      );
      ancestorBounds.unshift(hostElementBounds);

      for (const bounds of ancestorBounds) {
        top = Math.max(top, bounds.top);
        left = Math.max(left, bounds.left);
        bottom = Math.min(bottom, bounds.bottom);
        right = Math.min(right, bounds.right);
      }

      const scrollingElementBounds = scrollingElement.getBoundingClientRect();

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
  private _sizeHostElement(size?: Size | null) {
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

  public element(index: number): VirtualizerChildElementProxy | undefined {
    if (index === Infinity) {
      index = this._items.length - 1;
    }
    return this._items?.[index] === undefined
      ? undefined
      : {
          scrollIntoView: (options: ScrollIntoViewOptions = {}) =>
            this._scrollElementIntoView({...options, index}),
        };
  }

  private _scrollElementIntoView(options: ScrollElementIntoViewOptions) {
    options.index = Math.min(options.index, this._items.length - 1);
    if (options.behavior === 'smooth') {
      const coordinates = this._layout!.getScrollIntoViewCoordinates(options);
      const {behavior} = options;
      this._updateScrollIntoViewCoordinates = this._scroller!.managedScrollTo(
        Object.assign(coordinates, {behavior}),
        () => this._layout!.getScrollIntoViewCoordinates(options),
        () => (this._scrollIntoViewTarget = null)
      );
      this._scrollIntoViewTarget = options;
    } else {
      this._layout!.pin = options;
    }
  }

  /**
   * If we are smoothly scrolling to an element and the target element
   * is in the DOM, we update our target coordinates as needed
   */
  private _checkScrollIntoViewTarget(pos: ChildPositions | null) {
    const {index} = this._scrollIntoViewTarget || {};
    if (index && pos?.has(index)) {
      this._updateScrollIntoViewCoordinates!(
        this._layout!.getScrollIntoViewCoordinates(this._scrollIntoViewTarget!)
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

  private _layoutCompleteResolver: Function | null = null;
  private _layoutCompleteRejecter: Function | null = null;
  private _pendingLayoutComplete: number | null = null;
  public get layoutComplete(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._layoutCompleteResolver = resolve;
      this._layoutCompleteRejecter = reject;
    });
  }
  private _rejectLayoutCompletePromise(reason: string) {
    if (this._layoutCompleteRejecter !== null) {
      this._layoutCompleteRejecter!(reason);
    }
    this._resetLayoutCompleteState();
  }
  private _scheduleLayoutComplete() {
    if (this._pendingLayoutComplete !== null) {
      cancelAnimationFrame(this._pendingLayoutComplete);
    }
    this._pendingLayoutComplete = requestAnimationFrame(() =>
      this._layoutComplete()
    );
  }
  private _layoutComplete() {
    this._resolveLayoutCompletePromise();
    this._pendingLayoutComplete = null;
  }
  private _resolveLayoutCompletePromise() {
    if (this._layoutCompleteResolver !== null) {
      this._layoutCompleteResolver();
    }
    this._resetLayoutCompleteState();
  }
  private _resetLayoutCompleteState() {
    this._layoutCompleteResolver = null;
    this._layoutCompleteRejecter = null;
    this._pendingLayoutComplete = null;
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
    this._scheduleLayoutComplete();
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

type retargetScrollCallback = () => ScrollToCoordinates;
type endScrollCallback = () => void;

export class ScrollerShim {
  protected _node: Element | Window | null = null;
  protected _element: Element | null = null;

  constructor(element?: Element) {
    const node = element ?? window;
    this._node = node;
    if (element) {
      this._element = element;
    }
  }

  public get element() {
    return (
      this._element || document.scrollingElement || document.documentElement
    );
  }

  public get scrollTop() {
    return this.element.scrollTop || window.scrollY;
  }

  public get scrollLeft() {
    return this.element.scrollLeft || window.scrollX;
  }

  public get scrollHeight() {
    return this.element.scrollHeight;
  }

  public get scrollWidth() {
    return this.element.scrollWidth;
  }

  public get viewportHeight() {
    return this._element
      ? this._element.getBoundingClientRect().height
      : window.innerHeight;
  }

  public get viewportWidth() {
    return this._element
      ? this._element.getBoundingClientRect().width
      : window.innerWidth;
  }

  public get maxScrollTop() {
    return this.scrollHeight - this.viewportHeight;
  }

  public get maxScrollLeft() {
    return this.scrollWidth - this.viewportWidth;
  }
}

class Scroller extends ScrollerShim {
  private static _instanceMap: WeakMap<Element | Window, Scroller> =
    new WeakMap();
  private _originalScrollTo:
    | typeof Element.prototype.scrollTo
    | typeof window.scrollTo
    | null = null;
  private _originalScrollBy:
    | typeof Element.prototype.scrollBy
    | typeof window.scrollBy
    | null = null;
  private _originalScroll:
    | typeof Element.prototype.scroll
    | typeof window.scroll
    | null = null;
  private _clients: Array<unknown> = [];
  private _retarget: retargetScrollCallback | null = null;
  private _end: endScrollCallback | null = null;
  private __destination: ScrollToOptions | null = null;

  constructor(client: unknown, element?: Element) {
    super(element);
    const node = this._node!;
    const instance = Scroller._instanceMap.get(node!);
    if (instance) {
      instance._attach(client);
      return instance;
    } else {
      this._checkForArrival = this._checkForArrival.bind(this);
      this._updateManagedScrollTo = this._updateManagedScrollTo.bind(this);
      this.scrollTo = this.scrollTo.bind(this);
      this.scrollBy = this.scrollBy.bind(this);
      this._originalScrollTo = node.scrollTo;
      this._originalScrollBy = node.scrollBy;
      this._originalScroll = node.scroll;
      this._attach(client);
    }
  }

  public correctingScrollError = false;

  private get _destination() {
    return this.__destination;
  }

  public get scrolling() {
    return this._destination !== null;
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

  public scrollBy(options: ScrollToOptions): void;
  public scrollBy(x: number, y: number): void;
  public scrollBy(p1: ScrollToOptions | number, p2?: number): void;
  public scrollBy(p1: ScrollToOptions | number, p2?: number) {
    const options: ScrollToOptions =
      typeof p1 === 'number' && typeof p2 === 'number'
        ? {left: p1, top: p2}
        : (p1 as ScrollToOptions);
    if (options.top !== undefined) {
      options.top += this.scrollTop;
    }
    if (options.left !== undefined) {
      options.left += this.scrollLeft;
    }
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
      this._destination !== null &&
      left === this._destination.left &&
      top === this._destination.top
    ) {
      return false;
    }
    this.__destination = {top, left, behavior: 'smooth'};
    return true;
  }

  private _resetScrollState() {
    this.__destination = null;
    this._retarget = null;
    this._end = null;
  }

  private _updateManagedScrollTo(coordinates: ScrollToCoordinates) {
    if (this._destination) {
      if (this._setDestination(coordinates)) {
        this._nativeScrollTo(this._destination);
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

  public correctScrollError(coordinates: ScrollToCoordinates) {
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
    if (this._destination) {
      this._nativeScrollTo(this._destination);
    }
  }

  private _checkForArrival() {
    if (this._destination !== null) {
      const {scrollTop, scrollLeft} = this;
      let {top, left} = this._destination;
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
      this._node!.scrollBy = this._originalScrollBy!;
      this._node!.scroll = this._originalScroll!;
      this._node!.removeEventListener('scroll', this._checkForArrival);
    }
    return null;
  }

  private _attach(client: unknown) {
    this._clients.push(client);
    if (this._clients.length === 1) {
      this._node!.scrollTo = this.scrollTo;
      this._node!.scrollBy = this.scrollBy;
      this._node!.scroll = this.scrollTo;
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
