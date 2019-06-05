import {VirtualRepeater} from './VirtualRepeater.js';
import getResizeObserver from './polyfillLoaders/ResizeObserver.js';

const HOST_CLASSNAME = 'uni-virtualizer-host';
let globalContainerStylesheet = null;

function containerStyles(hostSel, childSel) {
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

export class RangeChangeEvent extends Event {
  constructor(type, init) {
    super(type, init);
    this._first = Math.floor(init.first || 0);
    this._last = Math.floor(init.last || 0);
  }
  get first() {
    return this._first;
  }
  get last() {
    return this._last;
  }
}

export class VirtualScroller extends VirtualRepeater {
  constructor(config) {
    super();

    this._num = 0;
    this._first = -1;
    this._last = -1;
    this._prevFirst = -1;
    this._prevLast = -1;

    this._needsUpdateView = false;
    this._layout = null;
    this._lazyLoadDefaultLayout = true;
    this._scrollTarget = null;
    // A sentinel element that sizes the container when it is a scrolling
    // element. This ensures the scroll bar accurately reflects the total
    // size of the list.
    this._sizer = null;
    // Layout provides these values, we set them on _render().
    this._scrollSize = null;
    this._scrollErr = null;
    // A list of the positions (top, left) of the children in the current
    // range.
    this._childrenPos = null;

    this._containerElement = null;
    // Keep track of original inline style of the container, so it can be
    // restored when container is changed.
    this._containerInlineStyle = null;
    this._containerStylesheet = null;
    this._useShadowDOM = true;
    this._containerSize = null;

    this._containerRO = null;
    this._childrenRO = null;
    this._skipNextChildrenSizeChanged = false;

    if (config) {
      Object.assign(this, config);
    }
  }

  get container() {
    return super.container;
  }
  set container(container) {
    super.container = container;

    this._initResizeObservers().then(() => {
      const oldEl = this._containerElement;
      // Consider document fragments as shadowRoots.
      const newEl =
          (container && container.nodeType === Node.DOCUMENT_FRAGMENT_NODE) ?
          container.host :
          container;
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
          oldEl.removeEventListener('scroll', this, {passive: true});
          this._sizer && this._sizer.remove();
        }
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
          this._container.prepend(this._sizer);
        }
        this._scheduleUpdateView();
        this._containerRO.observe(newEl);
      }
    })
  }

  get layout() {
    return this._layout;
  }
  set layout(layout) {
    if (layout === this._layout) {
      return;
    }

    if (this._layout) {
      this._measureCallback = null;
      this._layout.removeEventListener('scrollsizechange', this);
      this._layout.removeEventListener('scrollerrorchange', this);
      this._layout.removeEventListener('itempositionchange', this);
      this._layout.removeEventListener('rangechange', this);
      // Reset container size so layout can get correct viewport size.
      if (this._containerElement) {
        this._sizeContainer();
      }
    }

    this._layout = layout;

    if (this._layout) {
      // We want to lazy-load the default layout on render, but only
      // if none has ever been explicitly set
      this._lazyLoadDefaultLayout = false;
      if (typeof this._layout.updateItemSizes === 'function') {
        this._measureCallback = this._layout.updateItemSizes.bind(this._layout);
        this.requestRemeasure();
      }
      this._layout.addEventListener('scrollsizechange', this);
      this._layout.addEventListener('scrollerrorchange', this);
      this._layout.addEventListener('itempositionchange', this);
      this._layout.addEventListener('rangechange', this);
      this._scheduleUpdateView();
    }
  }

  /**
   * The element that generates scroll events and defines the container
   * viewport. The value `null` (default) corresponds to `window` as scroll
   * target.
   * @type {Element|null}
   */
  get scrollTarget() {
    return this._scrollTarget;
  }
  /**
   * @param {Element|null} target
   */
  set scrollTarget(target) {
    // Consider window as null.
    if (target === window) {
      target = null;
    }
    if (this._scrollTarget === target) {
      return;
    }
    if (this._scrollTarget) {
      this._scrollTarget.removeEventListener('scroll', this, {passive: true});
      if (this._sizer && this._scrollTarget === this._containerElement) {
        this._sizer.remove();
      }
    }

    this._scrollTarget = target;

    if (target) {
      target.addEventListener('scroll', this, {passive: true});
      if (target === this._containerElement) {
        this._sizer = this._sizer || this._createContainerSizer();
        this._container.prepend(this._sizer);
      }
    }
  }

  get useShadowDOM() {
    return this._useShadowDOM;
  }

  set useShadowDOM(newVal) {
    if (this._useShadowDOM !== newVal) {
      this._useShadowDOM = Boolean(newVal);
      if (this._containerStylesheet) {
        this._containerStylesheet.parentElement.removeChild(this._containerStylesheet);
        this._containerStylesheet = null;
      }
      this._applyContainerStyles();
    }
  }

  /**
   * Display the items in the current range.
   * Continue relayout of child positions until they have stabilized.
   * @protected
   */
  async _render() {
    if (this._lazyLoadDefaultLayout && !this._layout) {
      const { Layout1d } = await import('./layouts/Layout1d.js');
      this.layout = new Layout1d();
      return;
    }

    this._childrenRO.disconnect();

    // Update layout properties before rendering to have correct first, num,
    // scroll size, children positions.
    this._layout.totalItems = this.totalItems;
    if (this._needsUpdateView) {
      this._needsUpdateView = false;
      this._updateView();
    }
    this._layout.reflowIfNeeded();
    // Keep rendering until there is no more scheduled renders.
    while (true) {
      if (this._pendingRender) {
        // cancelAnimationFrame(this._pendingRender);
        this._pendingRender = false;
      }
      // Update scroll size and correct scroll error before rendering.
      this._sizeContainer(this._scrollSize);
      if (this._scrollErr) {
        // This triggers a 'scroll' event (async) which triggers another
        // _updateView().
        this._correctScrollError(this._scrollErr);
        this._scrollErr = null;
      }
      // Position children (_didRender()), and provide their measures to layout.
      await super._render();
      this._layout.reflowIfNeeded();
      // If layout reflow did not provoke another render, we're done.
      if (!this._pendingRender) {
        break;
      }
    }
    // We want to skip the first ResizeObserver callback call as we already
    // measured the children.
    this._skipNextChildrenSizeChanged = true;
    this._kids.forEach(child => this._childrenRO.observe(child));
  }

  /**
   * Position children before they get measured. Measuring will force relayout,
   * so by positioning them first, we reduce computations.
   * @protected
   */
  _didRender() {
    if (this._childrenPos) {
      this._positionChildren(this._childrenPos);
      this._childrenPos = null;
    }
  }

  /**
   * @param {!Event} event
   * @private
   */
  handleEvent(event) {
    switch (event.type) {
      case 'scroll':
        if (!this._scrollTarget || event.target === this._scrollTarget) {
          this._scheduleUpdateView();
        }
        break;
      case 'scrollsizechange':
        this._scrollSize = event.detail;
        this._scheduleRender();
        break;
      case 'scrollerrorchange':
        this._scrollErr = event.detail;
        this._scheduleRender();
        break;
      case 'itempositionchange':
        this._childrenPos = event.detail;
        this._scheduleRender();
        break;
      case 'rangechange':
        this._adjustRange(event.detail);
        break;
      default:
        console.warn('event not handled', event);
    }
  }

  /**
   * @private
   */
  async _initResizeObservers() {
    if (this._containerRO === null) {
      const ResizeObserver = await getResizeObserver();
      this._containerRO = new ResizeObserver(
        (entries) => this._containerSizeChanged(entries[0].contentRect));
      this._childrenRO =
        new ResizeObserver((entries) => this._childrenSizeChanged(entries));
    }
  }

  /**
   * @private
   */
  _applyContainerStyles() {
    if (this._useShadowDOM) {
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

  /**
   * @return {!Element}
   * @private
   */
  _createContainerSizer() {
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
    return sizer;
  }

  // TODO: Rename _ordered to _kids?
  /**
   * @protected
   */
  get _kids() {
    return this._ordered;
  }

  /**
   * Render and update the view at the next opportunity.
   * @private
   */
  _scheduleUpdateView() {
    this._needsUpdateView = true;
    this._scheduleRender();
  }

  /**
   * @private
   */
  _updateView() {
    let width, height, top, left;
    if (this._scrollTarget === this._containerElement) {
      width = this._containerSize.width;
      height = this._containerSize.height;
      left = this._containerElement.scrollLeft;
      top = this._containerElement.scrollTop;
    } else {
      const containerBounds = this._containerElement.getBoundingClientRect();
      const scrollBounds = this._scrollTarget ?
          this._scrollTarget.getBoundingClientRect() :
          {top: 0, left: 0, width: innerWidth, height: innerHeight};
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
      left = Math.max(0, -(containerBounds.x - scrollBounds.left));
      top = Math.max(0, -(containerBounds.y - scrollBounds.top));
    }
    this._layout.viewportSize = {width, height};
    this._layout.viewportScroll = {top, left};
  }

  /**
   * Styles the _sizer element or the container so that its size reflects the
   * total size of all items.
   * @private
   */
  _sizeContainer(size) {
    if (this._scrollTarget === this._containerElement) {
      const left = size && size.width ? size.width - 1 : 0;
      const top = size && size.height ? size.height - 1 : 0;
      this._sizer.style.transform = `translate(${left}px, ${top}px)`;
    } else {
      const style = this._containerElement.style;
      style.minWidth = size && size.width ? size.width + 'px' : null;
      style.minHeight = size && size.height ? size.height + 'px' : null;
    }
  }

  /**
   * Sets the top and left transform style of the children from the values in
   * pos.
   * @private
   * @param {Array<{top: number, left: number}>}
   */
  _positionChildren(pos) {
    const kids = this._kids;
    Object.keys(pos).forEach(key => {
      const idx = key - this._first;
      const child = kids[idx];
      if (child) {
        const {top, left} = pos[key];
        child.style.position = 'absolute';
        child.style.transform = `translate(${left}px, ${top}px)`;
      }
    });
  }

  /**
   * @private
   */
  _adjustRange(range) {
    this.num = range.num;
    this.first = range.first;
    this._incremental = !(range.stable);
    if (range.remeasure) {
      this.requestRemeasure();
    } else if (range.stable) {
      this._notifyStable();
    }
  }

  /**
   * @protected
   */
  _shouldRender() {
    if (!super._shouldRender() || !this._containerElement || (!this._layout && !this._lazyLoadDefaultLayout)) {
      return false;
    }
    // NOTE: we're about to render, but the ResizeObserver didn't execute yet.
    // Since we want to keep rAF timing, we compute _containerSize now. Would
    // be nice to have a way to flush ResizeObservers.
    if (this._containerSize === null) {
      const {width, height} = this._containerElement.getBoundingClientRect();
      this._containerSize = {width, height};
    }
    return this._containerSize.width > 0 || this._containerSize.height > 0;
  }

  /**
   * @private
   */
  _correctScrollError(err) {
    if (this._scrollTarget) {
      this._scrollTarget.scrollTop -= err.top;
      this._scrollTarget.scrollLeft -= err.left;
    } else {
      window.scroll(window.scrollX - err.left, window.scrollY - err.top);
    }
  }

  /**
   * Emits a rangechange event with the current first and last.
   * @protected
   */
  _notifyStable() {
    const {first, num} = this;
    const last = first + num - 1;
    this._container.dispatchEvent(
        new RangeChangeEvent('rangechange', {first, last}));
  }

  /**
   * Render and update the view at the next opportunity with the given
   * container size.
   * @private
   */
  _containerSizeChanged(size) {
    const {width, height} = size;
    this._containerSize = {width, height};
    this._scheduleUpdateView();
  }

  /**
   * @private
   */
  _childrenSizeChanged() {
    if (this._skipNextChildrenSizeChanged) {
      this._skipNextChildrenSizeChanged = false;
    } else {
      this.requestRemeasure();
    }
  }
}
