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
import {RangeChangedEvent, VisibilityChangedEvent, UnpinnedEvent} from './events.js';
import {ScrollerController} from './ScrollerController.js';

export const virtualizerRef = Symbol('virtualizerRef');
const SIZER_ATTRIBUTE = 'virtualizer-sizer';

declare global {
  interface HTMLElementEventMap {
    rangeChanged: RangeChangedEvent;
    visibilityChanged: VisibilityChangedEvent;
    unpinned: UnpinnedEvent;
  }
}

export interface VirtualizerHostElement extends HTMLElement {
  [virtualizerRef]?: Virtualizer;
}

/**
 * A very limited proxy object for a virtualizer child,
 * returned by Virtualizer.element(idx: number). Introduced
 * to enable scrolling a virtual element into view using
 * a call that looks and behaves essentially the same as for
 * a real Element. May be useful for other things later.
 */
export interface VirtualizerChildElementProxy {
  scrollIntoView: (options?: ScrollIntoViewOptions) => void;
}

/**
 * Used internally for scrolling a (possibly virtual) element
 * into view, given its index
 */
interface ScrollElementIntoViewOptions extends ScrollIntoViewOptions {
  index: number;
}

/**
 * Among the various ways to specify a layout for Virtualizer,
 * you can provide an actual Layout instance. You can also tear
 * down the current layout (if any) by setting the layout to null
 */
type LayoutInstanceValue = Layout | null;

/**
 * The main way to specify a layout is via a declarative Virtualizer
 * configuration. These are the different types of values accepted
 * for a layout in the Virtualizer config.
 */
export type LayoutConfigValue =
  | LayoutInstanceValue
  | LayoutConstructor
  | LayoutSpecifier
  | BaseLayoutConfig;

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

  /**
   * State variable for caching a provided layout config
   * while we wait for the default layout to load
   */
  private _cachedLayoutConfig: BaseLayoutConfig | null = null;

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

  private _scrollerController: ScrollerController | null = null;

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
    // If no layout is specified, we make an empty
    // layout config, which will result in the default
    // layout with default parameters
    this.layout = config.layout || ({} as BaseLayoutConfig);
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

    this._scrollerController = new ScrollerController(
      this,
      this._clippingAncestors[0]
    );

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
    this._hostElementRO!.observe(this._scrollerController!.element);
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
    this._scrollerController = this._scrollerController!.detach(this);
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

  get layout(): LayoutInstanceValue {
    return this._layout;
  }

  // We want there to be a default layout (currently, and probably
  // always, flow) so that users in the 80% case don't have to
  // explicitly import and instantiate one. However, we don't want
  // to make users of other layouts pay the cost of loading the
  // default one, so we load it dynamically when needed.
  //
  // This requires async setter behavior, but since a setter can't
  // actually be async, we wrap an async method.
  set layout(layoutConfig: LayoutConfigValue) {
    this._setLayout(layoutConfig);
  }

  async _setLayout(layoutConfig: LayoutConfigValue) {
    let instance: LayoutInstanceValue | undefined;
    let config: BaseLayoutConfig | undefined;
    let Ctor: LayoutConstructor | undefined;
    if (layoutConfig === null) {
      // If the config is null, the user is telling
      // us they don't want a layout yet (or that they
      // want to tear down the current layout)
      instance = null;
    } else {
      // We have a non-null config; let's see what we were given...
      const parsedConfig = this._parseLayoutConfig(layoutConfig);
      Ctor = parsedConfig.Ctor;
      instance = parsedConfig.instance;
      config = parsedConfig.config;

      // If no instance has been provided, we're responsible for
      // constructing one as needed
      if (instance === undefined) {
        if (Ctor === undefined) {
          // If the user hasn't provided a specific layout,
          // we will load the default
          if (this._cachedLayoutConfig !== null) {
            // If we have a cached config, we've already started
            // loading the default layout in a previous invocation
            // of this method and are still awaiting its arrival.
            // We'll bail and let that invocation finish, but first
            // we swap in our newer config.
            this._cachedLayoutConfig = config!;
            return;
          } else {
            // We don't already have a cached config, so we weren't
            // yet loading the default layout. We do so now, caching
            // the config to apply once we have the layout in hand.
            this._cachedLayoutConfig = config!;
            Ctor = (await import('./layouts/flow.js')).FlowLayout;
            if (this._cachedLayoutConfig === null) {
              // If a later call to `setLayout()` has resulted in a
              // different layout being set, the config we cached will
              // have been cleared. In this case, we bail.
              return;
            } else {
              // Now that we have the layout, we restore the provided
              // config from the cache and clear the cache
              config = this._cachedLayoutConfig;
              this._cachedLayoutConfig = null;
            }
          }
        } else {
          // The user has provided a specific layout constructor, so
          // we will just use it. But in case we were already awaiting
          // the default layout in a previous invocation of this method,
          // we clear the cached config to prevent that previous
          // invocation from finishing (since we want this newly
          // provided, likely non-default constructor to be used instead)
          this._cachedLayoutConfig = null;
        }
        if (this._layout instanceof Ctor) {
          // Now that we have a constructor, we check to see if
          // the current layout is an instance of the same type; if so,
          // we just apply the new config parameters and we're done
          this._layout.config = config;
          return;
        } else {
          // But if we don't have an instance, or if the current
          // instance is of another type, we make a new instance
          // of the requested type, with the provided parameters
          instance = new Ctor(config);
        }
      } else {
        // The user has provided an existing layout instance, so
        // we will just use it. But in case we were already awaiting
        // the default layout in a previous invocation of this method,
        // we clear the cached config to prevent that previous
        // invocation from finishing
        this._cachedLayoutConfig = null;
      }
    }

    // If we make it here, we have a new layout instance that
    // we need to wire up, or maching orders to set the layout
    // to null

    // Either way, if we have a current instance, we tear it down
    if (this._layout) {
      this._measureCallback = null;
      this._measureChildOverride = null;
      this._layout.removeEventListener('scrollsizechange', this);
      this._layout.removeEventListener('scrollerrorchange', this);
      this._layout.removeEventListener('itempositionchange', this);
      this._layout.removeEventListener('rangechange', this);
      this._layout.removeEventListener('unpinned', this);
      this._sizeHostElement(undefined);
      this._hostElement!.removeEventListener('load', this._loadListener, true);
    }

    // Now we update our internal state variable to the new
    // instance value (which may be null)
    this._layout = instance;

    // If we have an actual instance, not a null value, we
    // wire it up
    if (this._layout !== null) {
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
      this._layout.addEventListener('unpinned', this);
      if (this._layout.listenForChildLoadEvents) {
        this._hostElement!.addEventListener('load', this._loadListener, true);
      }
      this._schedule(this._updateLayout);
    }
  }

  /**
   * Helper for _setLayout()
   */
  _parseLayoutConfig(layoutConfig: LayoutConfigValue) {
    let instance: Layout | undefined;
    let Ctor: LayoutConstructor | undefined;
    let config: BaseLayoutConfig | undefined;
    if (typeof layoutConfig === 'object') {
      // With typeof === 'object', we may have...
      if ((layoutConfig as Layout).isVirtualizerLayoutInstance) {
        // ...an existing layout instance...
        instance = layoutConfig as Layout;
      } else if (typeof (layoutConfig as LayoutSpecifier).type === 'function') {
        // ...a 'layout specifier' with a `type` property, whose
        // value is a specific layout constructor. In this case,
        // we extract the constructor and store the rest of the
        // specifier as the layout config
        Ctor = (layoutConfig as LayoutSpecifier).type as LayoutConstructor;
        const copy = {...(layoutConfig as LayoutSpecifier)} as {
          type?: LayoutConstructor;
        };
        delete copy.type;
        config = copy as BaseLayoutConfig;
      } else {
        // ...or a config for the default layout, which we
        // identify by its lack of the `type` property
        config = layoutConfig as BaseLayoutConfig;
      }
    } else if (typeof layoutConfig === 'function') {
      // With typeof === 'function', we have a constructor
      Ctor = layoutConfig as LayoutConstructor;
    }
    return {instance, Ctor, config};
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
    if (this._scrollerController!.correctingScrollError === false) {
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
      case 'unpinned':
        this._hostElement!.dispatchEvent(new UnpinnedEvent());
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
    const scrollingElement = this._scrollerController?.element;
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
      const {scrollTop, scrollLeft} = this._scrollerController!;
      const {top, left} = this._scrollError;
      this._scrollError = null;
      this._scrollerController!.correctScrollError({
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
      this._updateScrollIntoViewCoordinates =
        this._scrollerController!.managedScrollTo(
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
    // Seems to require waiting one additional frame to
    // be sure the layout is stable
    this._pendingLayoutComplete = requestAnimationFrame(() =>
      requestAnimationFrame(() => this._layoutComplete())
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
