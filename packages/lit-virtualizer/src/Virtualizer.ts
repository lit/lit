/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import getResizeObserver from './polyfillLoaders/ResizeObserver.js';
import { ItemBox, Margins, Layout, Positions, LayoutConstructor, LayoutSpecifier } from './layouts/shared/Layout.js';

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
  [virtualizerRef]?: Virtualizer
}

interface ScrollSize {
  height: number | null,
  width: number | null
}

type ChildMeasurements = {[key: number]: ItemBox};

export type ScrollToIndexValue = {index: number, position?: string} | null;

export interface VirtualizerConfig {
  layout?: Layout | LayoutConstructor | LayoutSpecifier | null;

  /**
   * The parent of all child nodes to be rendered.
   */
  hostElement: VirtualizerHostElement;

  scroller?: boolean
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
  private _scrollError: {left: number, top: number} | null = null;

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
  private _scrollEventListenerOptions: AddEventListenerOptions = { passive: true };

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

   protected _measureChildOverride: (<T>(element: Element, item: T) => ItemBox) | null = null;

  constructor(config: VirtualizerConfig) {
    if (!config) {
      throw new Error('Virtualizer constructor requires a configuration object');
    }
    if (config.hostElement) {
      this._init(config);
    }
    else {
      throw new Error('Virtualizer configuration requires the "hostElement" property');
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
    this._isScroller  = !!config.scroller;
    this._initHostElement(config);
    this._initLayout(config);
  }

  private async _initObservers() {
    this._mutationObserver = new MutationObserver(this._observeMutations.bind(this));
    const ResizeObserver = await getResizeObserver();
    this._hostElementRO = new ResizeObserver(
      () => this._hostElementSizeChanged()
    );
    this._childrenRO =
      new ResizeObserver(this._childrenSizeChanged.bind(this));
  }

  async _initLayout(config: VirtualizerConfig) {
    if (config.layout) {
      this.layout = config.layout;
    }
    else {
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
      this._clippingAncestors = getClippingAncestors(this._hostElement!, includeSelf);
      this._schedule(this._updateLayout);
      this._observeAndListen();
  }

  _observeAndListen() {
    this._mutationObserver!.observe(this._hostElement!, { childList: true });
    this._mutationPromise = new Promise(resolve => this._mutationPromiseResolver = resolve);
    this._hostElementRO!.observe(this._hostElement!);
    this._scrollEventListeners.push(window);
    window.addEventListener('scroll', this, this._scrollEventListenerOptions);
    this._clippingAncestors.forEach(ancestor => {
      ancestor.addEventListener('scroll', this, this._scrollEventListenerOptions)
      this._scrollEventListeners.push(ancestor);
      this._hostElementRO!.observe(ancestor);
    });
    this._children.forEach((child) => this._childrenRO!.observe(child));
    this._scrollEventListeners.forEach(target => target.addEventListener('scroll', this, this._scrollEventListenerOptions));
  }

  disconnected() {
    this._scrollEventListeners.forEach((target) => target.removeEventListener('scroll', this, this._scrollEventListenerOptions));
    this._scrollEventListeners = [];
    this._clippingAncestors = [];
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
    const style = hostElement.style as CSSStyleDeclaration & { contain: string };
    style.display = style.display || 'block';
    style.position = style.position || 'relative';
    style.contain = style.contain || 'strict';

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
      let sizer = hostElement.querySelector(`[${SIZER_ATTRIBUTE}]`) as HTMLElement;
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
      this._sizeHostElement(undefined);
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

  /**
   * Index and position of item to scroll to. The virtualizer will fix to that point
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
    this._sizeHostElement(this._scrollSize);
    if (this._scrollError) {
      this._correctScrollError(this._scrollError);
      this._scrollError = null;
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
    const hostElement = this._hostElement!;
    const layout = this._layout!;

    let top, left, bottom, right;

    const hostElementBounds = hostElement.getBoundingClientRect();

    top = 0
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

    const scrollTop = top - hostElementBounds.top + hostElement.scrollTop;
    const scrollLeft = left - hostElementBounds.left + hostElement.scrollLeft;
    
    const height = Math.max(1, bottom - top);
    const width = Math.max(1, right - left);

    layout.viewportSize = {width, height};
    layout.viewportScroll = {top: scrollTop, left: scrollLeft};
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
    }
    else {
      const style = this._hostElement!.style;
      (style.minWidth as string | null) = h ? `${h}px` : '100%';
      (style.minHeight as string | null) = v ? `${v}px` : '100%';  
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
  }

  // This is the callback for the ResizeObserver that watches the
  // virtualizer's children. We land here at the end of every virtualizer
  // update cycle that results in changes to physical items, and we also
  // end up here if one or more children change size independently of
  // the virtualizer update cycle.
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
    return (parentNode as ShadowRoot).host || null;
  }
  return null;
}

function getElementAncestors(el: Element, includeSelf=false) {
  const ancestors = [];
  let parent = includeSelf ? el : getParentElement(el);
  while(parent !== null) {
    ancestors.push(parent);
    parent = getParentElement(parent);
  }
  return ancestors;
}

function getClippingAncestors(el: Element, includeSelf=false) {
  return getElementAncestors(el, includeSelf)
    .filter(a => getComputedStyle(a).overflow !== 'visible');
}