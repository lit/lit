/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ElementLayoutInfo,
  Margins,
  LayoutConfigValue,
  ChildPositions,
  ChildLayoutInfo,
  Layout,
  LayoutConstructor,
  LayoutSpecifier,
  StateChangedMessage,
  InternalRange,
  EditElementLayoutInfoFunction,
  ScrollToCoordinates,
  BaseLayoutConfig,
  PinOptions,
  LayoutHostMessage,
  writingMode,
  direction,
  virtualizerAxis,
  VirtualizerSize,
  VirtualizerSizeValue,
  LogicalCoordinates,
} from './layouts/shared/Layout.js';

// Internal physical-coordinate label types used by `_updateView` when
// translating between logical (block/inline) coordinates and the
// platform's physical scroll APIs. These are strictly internal to
// Virtualizer and should not be exposed on the layout-author surface.
type fixedSizeDimensionCapitalized = 'Height' | 'Width';
type fixedInsetLabel = 'top' | 'bottom' | 'left' | 'right';

/**
 * @deprecated Legacy scroll direction type from the old explicit direction API.
 * Use CSS `writing-mode` instead. This type and related handling code can be
 * removed when the deprecated `direction` config option is removed.
 */
type LegacyScrollDirection = 'vertical' | 'horizontal';

/**
 * @deprecated Legacy layout config interface supporting the old `direction` option.
 * This interface and related handling code can be removed when the deprecated
 * `direction` config option is removed.
 */
interface LegacyLayoutConfig extends BaseLayoutConfig {
  direction?: LegacyScrollDirection;
}
import {issueWarning, InstanceWarnings} from './warnings.js';
import {
  RangeChangedEvent,
  VisibilityChangedEvent,
  UnpinnedEvent,
} from './events.js';
import {ScrollerController} from './ScrollerController.js';

// Virtualizer depends on `ResizeObserver`, which is supported in
// all modern browsers. For developers whose browser support
// matrix includes older browsers, we include a compatible
// polyfill in the package; this bit of module state facilitates
// a simple mechanism (see ./polyfillLoaders/ResizeObserver.js.)
// for loading the polyfill.
let _ResizeObserver: typeof ResizeObserver | undefined =
  typeof window !== 'undefined' ? window.ResizeObserver : undefined;

/**
 * Call this function to provide a `ResizeObserver` polyfill for Virtualizer to use.
 * @param Ctor Constructor for a `ResizeObserver` polyfill (recommend using the one provided with the Virtualizer package)
 */
export function provideResizeObserver(Ctor: typeof ResizeObserver) {
  _ResizeObserver = Ctor;
}

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
export type ChildPositioningMethod = 'absolute' | 'translate';
export const defaultChildPositioningMethod: ChildPositioningMethod =
  'translate';

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

export interface VirtualizerConfig {
  layout?: LayoutConfigValue;

  /**
   * The parent of all child nodes to be rendered.
   */
  hostElement: VirtualizerHostElement;

  scroller?: boolean;

  /**
   * Controls which CSS logical axis the virtualizer scrolls along.
   * - `'block'` (default): virtualizes along the block axis (vertical in
   *   horizontal-tb, horizontal in vertical-lr/vertical-rl).
   * - `'inline'`: virtualizes along the inline axis by swapping the host
   *   element's `writing-mode`. Children are automatically restored to the
   *   context writing-mode so their content renders naturally.
   *
   * Mutually exclusive with setting CSS `writing-mode` directly on the host.
   */
  axis?: virtualizerAxis;

  /**
   * Declaratively pin the viewport to a specific item. The viewport will
   * remain pinned until the user scrolls, at which point the virtualizer
   * fires an `unpinned` event.
   */
  pin?: PinOptions;

  /**
   * Controls how the virtualizer positions its child elements.
   * - `'translate'` (default): uses CSS `transform: translate()`.
   * - `'absolute'`: uses CSS `left` and `top` properties.
   */
  positioning?: ChildPositioningMethod;
}

let DefaultLayoutConstructor: LayoutConstructor;

/**
 * Provides virtual scrolling boilerplate.
 *
 * Extensions of this class must set hostElement and layout.
 *
 * Extensions of this class must also override VirtualRepeater's DOM
 * manipulation methods.
 */
export class Virtualizer {
  private _warnings = new InstanceWarnings();

  private _childPositioningMethod: ChildPositioningMethod =
    defaultChildPositioningMethod;

  private _benchmarkStart: number | null = null;

  private _layout: Layout | null = null;

  private _clippingAncestors: HTMLElement[] = [];

  /**
   * Layout provides these values, we set them on _render().
   * TODO @straversi: Can we find an XOR type, usable for the key here?
   */
  private _virtualizerSize: VirtualizerSize | null = null;

  /**
   * Difference between scroll target's current and required scroll offsets.
   * Provided by layout.
   */
  private _scrollError: LogicalCoordinates | null = null;

  /**
   * A list of the positions (top, left) of the children in the current range.
   */
  private _childrenPos: ChildPositions | null = null;

  // TODO: (graynorton): type
  private _childLayoutInfo: ChildLayoutInfo | null = null;

  private _rangeChanged = false;

  private _itemsChanged = false;

  private _visibilityChanged = false;

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

  private _windowResizeCallback: (() => void) | null = null;

  private _mutationObserver: MutationObserver | null = null;

  private _scrollEventListeners: (Element | Window)[] = [];
  private _scrollEventListenerOptions: AddEventListenerOptions = {
    passive: true,
  };

  /**
   * When true, the layout update cycle is frozen because a large
   * scroll jump is in progress (e.g., thumb drag). Updates resume
   * when scrolling settles.
   */
  private _scrollFrozen = false;

  /**
   * Debounce timer for unfreezing after a large scroll jump.
   */
  private _scrollFreezeTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * How long (ms) to wait after the last scroll event before
   * unfreezing and re-rendering at the current position.
   * // TODO: May need further tuning and/or exposure as a config param.
   */
  private _scrollFreezeDelay = 50;

  /**
   * Minimum scroll delta, as a multiple of viewport height, to
   * trigger a freeze. Smaller values freeze more aggressively
   * (smoother thumb tracking but more blank flashes); larger values
   * allow more incremental updates before freezing.
   * // TODO: May need further tuning and/or exposure as a config param.
   */
  private _scrollFreezeThreshold = 20;

  /**
   * The last observed scroll position in the block direction,
   * used to detect large jumps.
   */
  private _lastBlockScrollPosition: number | null = null;

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

  private _writingMode: writingMode = 'unknown';
  private _scrollerWritingMode: writingMode = 'unknown';
  private _direction: direction = 'unknown';

  /**
   * Controls which CSS logical axis the virtualizer scrolls along.
   * When set to 'inline', the host's writing-mode is swapped so the
   * virtualizer scrolls along the inline axis instead of the block axis.
   */
  private _axis: virtualizerAxis = 'block';

  /**
   * The writing-mode of the context (i.e. the host element before
   * any axis-swap override is applied). Used to restore children's
   * writing-mode when axis='inline'.
   *
   * Captured only at the moment the swap is first applied (see
   * `_applyAxisSwap`), not live-tracked. If an ancestor's
   * writing-mode changes while `axis='inline'` is active, children
   * will continue to be restored to the originally-captured value.
   * In practice writing-mode is almost always a stable declaration,
   * so this is an acceptable edge-case simplification.
   */
  private _contextWritingMode: writingMode = 'unknown';

  /**
   * The CSS direction of the context (i.e. the host element before
   * any axis-swap override is applied). Used to determine the correct
   * swapped writing-mode for axis='inline'. Capture semantics match
   * `_contextWritingMode`.
   */
  private _contextDirection: direction = 'unknown';

  /**
   * Tracks whether we've injected a writing-mode style for the axis
   * swap. Used to avoid re-reading context styles and to clean up
   * when axis reverts to 'block'.
   */
  private _axisWritingModeInjected = false;

  /**
   * @deprecated Tracks whether we've injected a writing-mode style for legacy
   * direction config compatibility. This flag and related handling code can be
   * removed when the deprecated `direction` config option is removed.
   */
  private _legacyDirectionWritingModeInjected = false;

  /**
   * @deprecated Tracks whether writingMode changed during _updateView() due to
   * legacy direction config. When true, _updateLayout() will force a reflow.
   * This flag and related handling code can be removed when the deprecated
   * `direction` config option is removed.
   */
  private _writingModeChanged = false;

  /**
   * @deprecated Stores the expected writingMode based on legacy direction config.
   * This is used to set the layout's writingMode immediately after creation,
   * before the first _updateView() runs. This field and related handling code
   * can be removed when the deprecated `direction` config option is removed.
   */
  private _pendingWritingMode: writingMode | null = null;

  protected _scheduled = new WeakSet();

  /**
   * Invoked at the end of each render cycle: children in the range are
   * measured, and their dimensions passed to this callback. Use it to layout
   * children as needed.
   */
  protected _measureCallback: ((sizes: ChildLayoutInfo) => void) | null = null;

  protected _editElementLayoutInfo: EditElementLayoutInfoFunction | null = null;

  /**
   * State for `layoutComplete` promise
   */
  private _layoutCompletePromise: Promise<void> | null = null;
  private _layoutCompleteResolver: Function | null = null;
  private _layoutCompleteRejecter: Function | null = null;
  private _pendingLayoutComplete: number | null = null;
  /**
   * Set when _scheduleLayoutComplete is called but no promise exists yet.
   * Allows the layoutComplete getter to schedule resolution immediately
   * if layout already stabilized before the promise was first accessed.
   */
  private _layoutCompleteScheduleNeeded = false;

  /**
   * Layout initialization is async because we dynamically load
   * the default layout if none is specified. This state is to track
   * whether init is complete.
   */
  private _layoutInitialized: Promise<void> | null = null;

  /**
   * Pending pin value, stored before layout is initialized.
   */
  private _pendingPin: PinOptions | undefined = undefined;

  /**
   * Track connection state to guard against errors / unnecessary work
   */
  private _connected = false;

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

  get axis(): virtualizerAxis {
    return this._axis;
  }

  set axis(value: virtualizerAxis) {
    if (value !== this._axis) {
      this._axis = value;
      this._applyAxisSwap();
      this._schedule(this._updateLayout);
    }
  }

  /**
   * Declaratively pin the viewport to a specific item. The viewport will
   * remain pinned until the user scrolls, at which point the virtualizer
   * fires an `unpinned` event.
   */
  get pin(): PinOptions | undefined {
    return this._pendingPin;
  }

  set pin(value: PinOptions | undefined) {
    if (value === this._pendingPin) {
      return;
    }
    this._pendingPin = value;
    if (this._layout) {
      this._layout.pin = value ?? null;
    }
  }

  _init(config: VirtualizerConfig) {
    this._isScroller = !!config.scroller;
    this._childPositioningMethod =
      config.positioning || defaultChildPositioningMethod;
    if (config.axis) {
      this._axis = config.axis;
    }
    if (config.pin) {
      this._pendingPin = config.pin;
    }
    this._initHostElement(config);
    // If no layout is specified, we make an empty
    // layout config, which will result in the default
    // layout with default parameters.
    // Make a shallow copy to avoid mutating the original config
    // (e.g., _handleLegacyDirectionConfig deletes the direction property)
    const layoutConfig = config.layout
      ? {...config.layout}
      : ({} as BaseLayoutConfig);
    // Save the promise returned by `_initLayout` as a state
    // variable we can check before updating layout config
    this._layoutInitialized = this._initLayout(layoutConfig);
  }

  private _initObservers() {
    this._mutationObserver = new MutationObserver((records) => {
      this._finishDOMUpdate();
      // When children are reordered (e.g. by lit-html's repeat directive),
      // the ResizeObserver won't fire because no individual element changed
      // size. Detect reorders — where a node appears in both addedNodes and
      // removedNodes — and trigger a re-measure so the layout picks up the
      // new index-to-size mapping.
      const added = new Set<Node>();
      const removed = new Set<Node>();
      for (const record of records) {
        record.addedNodes.forEach((n) => added.add(n));
        record.removedNodes.forEach((n) => removed.add(n));
      }
      for (const node of added) {
        if (removed.has(node)) {
          this._readLayoutInfo();
          break;
        }
      }
    });
    this._hostElementRO = new _ResizeObserver!(() =>
      this._viewportSizeChanged()
    );
    this._childrenRO = new _ResizeObserver!(
      this._childrenSizeChanged.bind(this)
    );
    this._windowResizeCallback = this._viewportSizeChanged.bind(this);
  }

  _initHostElement(config: VirtualizerConfig) {
    const hostElement = (this._hostElement = config.hostElement);
    this._applyVirtualizerStyles();
    hostElement[virtualizerRef] = this;
  }

  connected() {
    this._initObservers();
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
    this._connected = true;
  }

  _observeAndListen() {
    this._mutationObserver!.observe(this._hostElement!, {
      childList: true,
      characterData: true,
      subtree: true,
    });
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
    window.addEventListener('resize', this._windowResizeCallback!);
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
    this._scrollerController?.detach(this);
    this._scrollerController = null;
    this._mutationObserver?.disconnect();
    this._mutationObserver = null;
    this._hostElementRO?.disconnect();
    this._hostElementRO = null;
    window.removeEventListener('resize', this._windowResizeCallback!);
    this._childrenRO?.disconnect();
    this._childrenRO = null;
    this._rejectLayoutCompletePromise('disconnected');
    this._connected = false;
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
    } else {
      // For non-scroller mode (window scrolling), set initial min sizes to
      // bootstrap the rendering cycle. With contain: size, the element won't
      // have intrinsic size, so we need at least 1px to prevent isHidden=true.
      // This is especially important for vertical writing modes where the
      // element might not inherit width from the containing block.
      style.minBlockSize = style.minBlockSize || '1px';
      style.minInlineSize = style.minInlineSize || '1px';
    }
  }

  /**
   * @deprecated Handles the legacy `direction` layout config option by
   * translating it to the equivalent CSS `writing-mode` on the host element.
   * This method and all related handling code can be removed when the
   * deprecated `direction` config option is removed.
   *
   * Legacy mapping:
   * - direction: 'vertical' (default) → writing-mode: horizontal-tb (CSS default)
   * - direction: 'horizontal' → writing-mode: vertical-lr
   */
  private _handleLegacyDirectionConfig(config: LegacyLayoutConfig): void {
    // If no direction specified, treat as 'vertical' (the old default behavior)
    // which maps to the CSS default, so we may need to clean up any previously
    // injected style
    const legacyDirection: LegacyScrollDirection =
      config.direction === 'horizontal' ? 'horizontal' : 'vertical';

    const hostElement = this._hostElement!;
    const style = hostElement.style;

    if (legacyDirection === 'horizontal') {
      // Check if there's an existing writing-mode we'd be overriding
      const existingWritingMode = style.writingMode;
      if (
        existingWritingMode &&
        existingWritingMode !== 'vertical-lr' &&
        !this._legacyDirectionWritingModeInjected
      ) {
        issueWarning(
          'virtualizer-deprecated-direction-override',
          '[lit-virtualizer] The deprecated `direction: "horizontal"` config ' +
            `is overriding an existing \`writing-mode: ${existingWritingMode}\` ` +
            'style on the host element. Please migrate to using CSS ' +
            '`writing-mode: vertical-lr` directly instead of the `direction` config.'
        );
      } else {
        issueWarning(
          'virtualizer-deprecated-direction',
          '[lit-virtualizer] The `direction` layout config option is deprecated. ' +
            'Use CSS `writing-mode` instead. For horizontal scrolling, apply ' +
            '`writing-mode: vertical-lr` to the virtualizer element.'
        );
      }
      style.writingMode = 'vertical-lr';
      this._legacyDirectionWritingModeInjected = true;
      // @deprecated: Store expected writingMode so it can be set on the layout
      // immediately after creation, before _updateView runs. Also set
      // this._writingMode immediately so it's correct even if connected() is
      // called before layout creation (due to async _initLayout).
      this._pendingWritingMode = 'vertical-lr';
      this._writingMode = 'vertical-lr';
    } else {
      // direction: 'vertical' (or unspecified) - revert to default if we
      // previously injected a writing-mode
      if (this._legacyDirectionWritingModeInjected) {
        style.writingMode = '';
        this._legacyDirectionWritingModeInjected = false;
      }
      // @deprecated: Store expected writingMode so it can be set on the layout
      // immediately after creation, before _updateView runs. Also set
      // this._writingMode immediately so it's correct even if connected() is
      // called before layout creation (due to async _initLayout).
      this._pendingWritingMode = 'horizontal-tb';
      this._writingMode = 'horizontal-tb';
      // Only warn if direction was explicitly specified
      if (config.direction !== undefined) {
        issueWarning(
          'virtualizer-deprecated-direction',
          '[lit-virtualizer] The `direction` layout config option is deprecated. ' +
            '`direction: "vertical"` is the default behavior and can be removed.'
        );
      }
    }

    // Remove direction from config so the layout doesn't receive an unknown property
    delete config.direction;
  }

  /**
   * Applies or removes the writing-mode swap for `axis='inline'`.
   *
   * When `axis='inline'`, the host's writing-mode is swapped so the
   * virtualizer scrolls along the inline axis. The context (original)
   * writing-mode is captured before the swap and later restored on
   * children in `_positionChildren`.
   */
  private _applyAxisSwap() {
    const host = this._hostElement;
    if (!host || !host.isConnected) return;

    if (this._axis === 'inline') {
      // Guard: axis and legacy direction are mutually exclusive
      if (this._legacyDirectionWritingModeInjected) {
        this._warnings.warnOnce(
          'axis-direction-conflict',
          '[lit-virtualizer] The `axis` property cannot be used together with ' +
            'the deprecated `direction` layout config option. The `axis` ' +
            'setting will be ignored.'
        );
        return;
      }

      if (!this._axisWritingModeInjected) {
        // Warn if there's an explicit inline writing-mode we're about to override
        const existingInlineWM = host.style.writingMode;
        if (existingInlineWM && existingInlineWM !== '') {
          this._warnings.warnOnce(
            'axis-writing-mode-conflict',
            '[lit-virtualizer] Both `axis="inline"` and an explicit CSS ' +
              '`writing-mode` are set on the virtualizer host. The `axis` ' +
              'property will take precedence. These options are mutually ' +
              'exclusive — use one or the other.'
          );
        }

        // Capture the context writing-mode before we override it
        const style = getComputedStyle(host);
        this._contextWritingMode = style.writingMode as writingMode;
        this._contextDirection = style.direction as direction;
      }

      // Swap: horizontal-tb → vertical-lr/rl (depending on CSS direction),
      //        vertical-lr/rl → horizontal-tb
      const swapped =
        this._contextWritingMode === 'horizontal-tb'
          ? this._contextDirection === 'rtl'
            ? 'vertical-rl'
            : 'vertical-lr'
          : 'horizontal-tb';
      host.style.writingMode = swapped;
      this._axisWritingModeInjected = true;
    } else if (this._axisWritingModeInjected) {
      // Revert to context writing-mode
      host.style.writingMode = '';
      this._axisWritingModeInjected = false;
      // Clear restored writing-mode from children
      this._children.forEach((child) => {
        child.style.writingMode = '';
      });
    }
  }

  _getSizer() {
    const hostElement = this._hostElement!;
    if (!this._sizer) {
      // Use a preexisting sizer element if provided (for better integration
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
      sizer.textContent = '&nbsp;';
      sizer.setAttribute(SIZER_ATTRIBUTE, '');
      this._sizer = sizer;
    }
    return this._sizer;
  }

  async updateLayoutConfig(layoutConfig: LayoutConfigValue) {
    // If layout initialization hasn't finished yet, we wait
    // for it to finish so we can check whether the new config
    // is compatible with the existing layout before proceeding.
    await this._layoutInitialized;
    const Ctor =
      ((layoutConfig as LayoutSpecifier).type as LayoutConstructor) ||
      // The new config is compatible with the current layout,
      // so we update the config and return true to indicate
      // a successful update
      DefaultLayoutConstructor;
    if (typeof Ctor === 'function' && this._layout instanceof Ctor) {
      const config = {...(layoutConfig as LayoutSpecifier)} as {
        type?: LayoutConstructor;
      };
      delete config.type;
      // @deprecated: Handle legacy direction config. This block can be removed
      // when the deprecated `direction` config option is removed.
      if ('direction' in config) {
        this._handleLegacyDirectionConfig(config as LegacyLayoutConfig);
        // Set the writingMode on the layout immediately so it's correct
        // before the next reflow.
        if (this._pendingWritingMode !== null) {
          this._layout.writingMode = this._pendingWritingMode;
          this._writingMode = this._pendingWritingMode;
          this._pendingWritingMode = null;
        }
        // Schedule _updateLayout to re-read the CSS writing-mode
        this._schedule(this._updateLayout);
      }
      // @deprecated: Detect pin in layout config and warn.
      // This block can be removed when the deprecated layout config `pin` is removed.
      if ('pin' in config && (config as BaseLayoutConfig).pin) {
        this._warnings.warnOnce(
          'pin-in-layout-config',
          'Setting `pin` via layout config is deprecated. Use the `pin` property on ' +
            '<lit-virtualizer>, the virtualize directive, or the Virtualizer directly instead.'
        );
      }
      this._layout.config = config as BaseLayoutConfig;
      // The new config requires a different layout altogether, but
      // to limit implementation complexity we don't support dynamically
      // changing the layout of an existing virtualizer instance.
      // Returning false here lets the caller know that they should
      // instead make a new virtualizer instance with the desired layout.
      return true;
    }
    return false;
  }

  private async _initLayout(layoutConfig: LayoutConfigValue) {
    let config: BaseLayoutConfig | undefined;
    let Ctor: LayoutConstructor | undefined;
    if (typeof (layoutConfig as LayoutSpecifier).type === 'function') {
      // If we have a full LayoutSpecifier, the `type` property
      // gives us our constructor...
      Ctor = (layoutConfig as LayoutSpecifier).type as LayoutConstructor;
      // ...while the rest of the specifier is our layout config
      const copy = {...(layoutConfig as LayoutSpecifier)} as {
        type?: LayoutConstructor;
      };
      delete copy.type;
      config = copy as BaseLayoutConfig;
    } else {
      // If we don't have a full LayoutSpecifier, we just
      // have a config for the default layout
      config = layoutConfig as BaseLayoutConfig;
    }

    // @deprecated: Handle legacy direction config. This block can be removed
    // when the deprecated `direction` config option is removed.
    if (config && 'direction' in config) {
      this._handleLegacyDirectionConfig(config as LegacyLayoutConfig);
    }

    // @deprecated: Detect pin in layout config and warn.
    // This block can be removed when the deprecated layout config `pin` is removed.
    if (config && 'pin' in config && (config as BaseLayoutConfig).pin) {
      this._warnings.warnOnce(
        'pin-in-layout-config',
        'Setting `pin` via layout config is deprecated. Use the `pin` property on ' +
          '<lit-virtualizer>, the virtualize directive, or the Virtualizer directly instead.'
      );
    }

    if (Ctor === undefined) {
      // If we don't have a constructor yet, load the default
      DefaultLayoutConstructor = Ctor = (await import('./layouts/flow.js'))
        .FlowLayout as unknown as LayoutConstructor;
    }

    this._layout = new Ctor(
      (message: LayoutHostMessage) => this._handleLayoutMessage(message),
      config
    );

    // @deprecated: If legacy direction config was used, set the writingMode
    // on the layout immediately so it's correct before the first reflow.
    // This can be removed when the deprecated `direction` config option is removed.
    if (this._pendingWritingMode !== null) {
      this._layout.writingMode = this._pendingWritingMode;
      this._writingMode = this._pendingWritingMode;
      this._pendingWritingMode = null;
    }

    // Apply any pending pin from the Virtualizer-level config
    if (this._pendingPin !== undefined) {
      this._layout.pin = this._pendingPin;
    }

    if (typeof this._layout.updateItemSizes === 'function') {
      if (this._layout.editElementLayoutInfo) {
        this._editElementLayoutInfo = this._layout.editElementLayoutInfo.bind(
          this._layout
        );
      }
      this._measureCallback = this._layout.updateItemSizes.bind(this._layout);
    }

    if (this._layout.listenForChildLoadEvents) {
      this._hostElement!.addEventListener('load', this._loadListener, true);
    }

    this._schedule(this._updateLayout);
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

  private _readLayoutInfo(): void {
    this._childLayoutInfo = new Map();
    const children = this._children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const idx = this._first + i;
      this._childLayoutInfo.set(idx, this._readElementLayoutInfo(child, idx));
    }
    this._schedule(this._updateLayout);
  }

  /**
   * Returns the width, height, and margins of the given child.
   */
  _readElementLayoutInfo(element: Element, index: number): ElementLayoutInfo {
    // offsetWidth doesn't take transforms in consideration, so we use
    // getBoundingClientRect which does.
    const {width, height} = element.getBoundingClientRect();
    const hostIsHorizontal = isHorizontalWritingMode(this._writingMode);
    const blockSize = hostIsHorizontal ? height : width;
    const inlineSize = hostIsHorizontal ? width : height;
    const style = getComputedStyle(element);
    const writingMode = style.writingMode as writingMode;
    const direction = style.direction as direction;
    const flipAxis = isHorizontalWritingMode(writingMode) !== hostIsHorizontal;
    const reverseDirection = direction !== this._direction;
    const baselineInfo = Object.assign(
      {writingMode, direction},
      {blockSize, inlineSize},
      getMargins(element, flipAxis, reverseDirection)
    );
    const item = this._items[index];
    return this._editElementLayoutInfo
      ? this._editElementLayoutInfo({element, item, index, baselineInfo})
      : baselineInfo;
  }

  protected async _schedule(method: Function): Promise<void> {
    if (!this._scheduled.has(method)) {
      this._scheduled.add(method);
      await Promise.resolve();
      this._scheduled.delete(method);
      method.call(this);
    }
  }

  async _updateDOM(state: StateChangedMessage) {
    this._virtualizerSize = state.virtualizerSize;
    this._adjustRange(state.range);
    this._childrenPos = state.childPositions;
    this._scrollError = state.scrollError || null;
    const {_rangeChanged, _itemsChanged} = this;
    if (this._visibilityChanged) {
      this._notifyVisibility();
      this._visibilityChanged = false;
    }
    if (_rangeChanged || _itemsChanged) {
      this._notifyRange();
      this._rangeChanged = false;
      this._itemsChanged = false;
    } else {
      this._finishDOMUpdate();
    }
  }

  _finishDOMUpdate() {
    // Skip when the host has been detached without `disconnected()` being
    // called — common for the bare `virtualize()` directive when a parent
    // node is removed without clearing its lit-html template. A zombie
    // virtualizer would otherwise continue producing scroll corrections
    // against its (now stale, zero-measuring) children and hijack a shared
    // scroller (e.g. `window`). We bail silently rather than tearing
    // down, because `AsyncDirective` has no auto-reconnect hook — a later
    // re-attach of a bare-directive host would have no way to revive us.
    if (this._connected && this._hostElement?.isConnected) {
      // _childrenRO should be non-null if we're connected
      this._children.forEach((child) => this._childrenRO!.observe(child));
      this._checkScrollIntoViewTarget(this._childrenPos);
      this._sizeHostElement(this._virtualizerSize);
      this._positionChildren(this._childrenPos);
      this._correctScrollError();
      if (this._benchmarkStart && 'mark' in window.performance) {
        window.performance.mark('uv-end');
      }
    }
  }

  _updateLayout() {
    if (this._scrollFrozen) {
      return;
    }
    if (this._layout && this._connected) {
      // Apply axis swap before reading styles so that _updateView
      // reads the correct (swapped) writing-mode from CSS.
      this._applyAxisSwap();
      this._layout.items = this._items;
      this._updateView();
      if (this._childLayoutInfo !== null) {
        // If the layout has been changed, we may have measurements but no callback
        if (this._measureCallback) {
          this._measureCallback(this._childLayoutInfo);
        }
      }
      // @deprecated: When using legacy `direction` config, writingMode may have
      // changed during _updateView(). Force a reflow to recalculate with the new
      // writing mode. This can be removed when the deprecated `direction` config
      // option is removed.
      if (this._writingModeChanged) {
        this._writingModeChanged = false;
        this._layout.reflowIfNeeded(true);
      } else {
        this._layout.reflowIfNeeded();
      }
      if (this._benchmarkStart && 'mark' in window.performance) {
        window.performance.mark('uv-end');
      }
    }
  }

  private _handleScrollEvent() {
    // Ignore scrolls on a shared ancestor scroller when our host is no
    // longer in the DOM. Bare `virtualize()` directives on a removed
    // subtree never receive `disconnected()`; without this guard they
    // would keep reflowing and issuing scroll corrections against the
    // shared scroller on every scroll event. Bail silently rather than
    // tear down so that a later re-attach (which `AsyncDirective` has
    // no hook to auto-detect) can resume normal operation.
    if (!this._hostElement?.isConnected) {
      return;
    }
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

      // Detect large scroll jumps and freeze the update cycle
      const scrollTop = this._scrollerController!.scrollTop;
      const clientHeight =
        this._scrollerController!.element.getBoundingClientRect().height;

      if (this._lastBlockScrollPosition !== null) {
        const delta = Math.abs(scrollTop - this._lastBlockScrollPosition);
        if (
          delta > clientHeight * this._scrollFreezeThreshold ||
          this._scrollFrozen
        ) {
          if (!this._scrollFrozen) {
            this._layout?.freeze();
          }
          this._scrollFrozen = true;
          this._lastBlockScrollPosition = scrollTop;
          // Reset the debounce timer
          if (this._scrollFreezeTimer !== null) {
            clearTimeout(this._scrollFreezeTimer);
          }
          this._scrollFreezeTimer = setTimeout(() => {
            this._scrollFreezeTimer = null;
            this._unfreezeScroll();
          }, this._scrollFreezeDelay);
          return;
        }
      }
      this._lastBlockScrollPosition = scrollTop;
    }
    this._schedule(this._updateLayout);
  }

  private _unfreezeScroll() {
    this._scrollFrozen = false;
    this._lastBlockScrollPosition = this._scrollerController!.scrollTop;
    this._layout?.unfreeze();
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
      default:
        console.warn('event not handled', event);
    }
  }

  _handleLayoutMessage(message: LayoutHostMessage) {
    if (message.type === 'stateChanged') {
      this._updateDOM(message);
    } else if (message.type === 'visibilityChanged') {
      this._firstVisible = message.firstVisible;
      this._lastVisible = message.lastVisible;
      this._notifyVisibility();
    } else if (message.type === 'unpinned') {
      this._hostElement!.dispatchEvent(new UnpinnedEvent());
    }
  }

  get _children(): Array<HTMLElement> {
    const arr: Array<HTMLElement> = [];
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

    if (hostElement && hostElement.isConnected && scrollingElement && layout) {
      const hostStyle = getComputedStyle(hostElement);
      const scrollerStyle = getComputedStyle(scrollingElement);

      const direction = (this._direction = hostStyle.direction as direction);
      // Host writing-mode: used for child positioning and sizing
      const writingMode = (this._writingMode =
        hostStyle.writingMode as writingMode);
      // Scroller writing-mode: used for scroll coordinate handling
      const scrollerWritingMode = (this._scrollerWritingMode =
        scrollerStyle.writingMode as writingMode);

      let insetBlockStart: number,
        insetBlockEnd: number,
        insetInlineStart: number,
        insetInlineEnd: number,
        blockSizeLabel: fixedSizeDimensionCapitalized,
        inlineSizeLabel: fixedSizeDimensionCapitalized,
        blockStartLabel: fixedInsetLabel,
        blockEndLabel: fixedInsetLabel,
        inlineStartLabel: fixedInsetLabel,
        inlineEndLabel: fixedInsetLabel,
        blockScrollPosition: (el: Element) => number,
        inlineScrollPosition: (el: Element) => number,
        reverseBlockCoordinates = false,
        reverseInlineCoordinates = false;

      // Whether scrollLeft is inverted (0 at right, negative toward left) depends
      // on the SCROLLER's writing-mode, not the host's.
      const scrollerHasInvertedScrollLeft =
        scrollerWritingMode === 'vertical-rl';

      if (writingMode === 'horizontal-tb') {
        blockSizeLabel = 'Height';
        inlineSizeLabel = 'Width';
        blockStartLabel = 'top';
        blockEndLabel = 'bottom';
        // Block axis is vertical, uses scrollTop (never inverted)
        blockScrollPosition = (el: Element) => el.scrollTop;
        if (direction === 'ltr') {
          inlineStartLabel = 'left';
          inlineEndLabel = 'right';
          // Inline axis is horizontal, uses scrollLeft
          // Negate if scroller has inverted scrollLeft (vertical-rl)
          inlineScrollPosition = scrollerHasInvertedScrollLeft
            ? (el: Element) => -el.scrollLeft
            : (el: Element) => el.scrollLeft;
        } else {
          inlineStartLabel = 'right';
          inlineEndLabel = 'left';
          // RTL: inline-start is right, so we negate unless scroller already inverts
          inlineScrollPosition = scrollerHasInvertedScrollLeft
            ? (el: Element) => el.scrollLeft
            : (el: Element) => -el.scrollLeft;
          reverseInlineCoordinates = true;
        }
      } else {
        blockSizeLabel = 'Width';
        inlineSizeLabel = 'Height';
        if (writingMode === 'vertical-lr') {
          blockStartLabel = 'left';
          blockEndLabel = 'right';
          // Block axis is horizontal, uses scrollLeft
          // Negate if scroller has inverted scrollLeft (vertical-rl)
          blockScrollPosition = scrollerHasInvertedScrollLeft
            ? (el: Element) => -el.scrollLeft
            : (el: Element) => el.scrollLeft;
        } else {
          // vertical-rl host: block-start is right
          blockStartLabel = 'right';
          blockEndLabel = 'left';
          // Block axis is horizontal, uses scrollLeft
          // For vertical-rl host, we want 0 at block-start (right)
          // If scroller is also vertical-rl, scrollLeft=0 at right, negate to get positive values toward block-end
          // If scroller is not vertical-rl, scrollLeft=0 at left, which is block-end, so don't negate
          blockScrollPosition = scrollerHasInvertedScrollLeft
            ? (el: Element) => -el.scrollLeft
            : (el: Element) => el.scrollLeft;
          reverseBlockCoordinates = true;
        }
        if (direction === 'ltr') {
          inlineStartLabel = 'top';
          inlineEndLabel = 'bottom';
          // Inline axis is vertical, uses scrollTop (never inverted)
          inlineScrollPosition = (el: Element) => el.scrollTop;
        } else {
          inlineStartLabel = 'bottom';
          inlineEndLabel = 'top';
          inlineScrollPosition = (el: Element) => -el.scrollTop;
          reverseInlineCoordinates = true;
        }
      }

      const hostElementBounds = hostElement.getBoundingClientRect();

      insetBlockStart = reverseBlockCoordinates
        ? window[`inner${blockSizeLabel}`]
        : 0;
      insetInlineStart = reverseInlineCoordinates
        ? window[`inner${inlineSizeLabel}`]
        : 0;
      insetBlockEnd = reverseBlockCoordinates
        ? 0
        : window[`inner${blockSizeLabel}`];
      insetInlineEnd = reverseInlineCoordinates
        ? 0
        : window[`inner${inlineSizeLabel}`];

      const ancestorBounds = this._clippingAncestors.map((ancestor) =>
        ancestor.getBoundingClientRect()
      );
      ancestorBounds.unshift(hostElementBounds);

      const blockMax = reverseBlockCoordinates ? Math.min : Math.max;
      const blockMin = reverseBlockCoordinates ? Math.max : Math.min;
      const inlineMax = reverseInlineCoordinates ? Math.min : Math.max;
      const inlineMin = reverseInlineCoordinates ? Math.max : Math.min;

      for (const bounds of ancestorBounds) {
        insetBlockStart = blockMax(insetBlockStart, bounds[blockStartLabel]);
        insetInlineStart = inlineMax(
          insetInlineStart,
          bounds[inlineStartLabel]
        );
        insetBlockEnd = blockMin(insetBlockEnd, bounds[blockEndLabel]);
        insetInlineEnd = inlineMin(insetInlineEnd, bounds[inlineEndLabel]);
      }

      const scrollingElementBounds = scrollingElement.getBoundingClientRect();

      let offsetBlock: number;
      let offsetInline: number;

      if (this._isScroller) {
        offsetBlock = 0;
        offsetInline = 0;
      } else {
        offsetBlock =
          hostElementBounds[blockStartLabel] -
          scrollingElementBounds[blockStartLabel];
        offsetInline =
          hostElementBounds[inlineStartLabel] -
          scrollingElementBounds[inlineStartLabel];
        if (!this._scrollerController!.isDocumentScroller) {
          offsetBlock += blockScrollPosition(scrollingElement);
          offsetInline += inlineScrollPosition(scrollingElement);
        }
      }

      layout.offsetWithinScroller = {
        inline: offsetInline,
        block: offsetBlock,
      };

      layout.scrollSize = {
        inlineSize: scrollingElement[`scroll${inlineSizeLabel}`],
        blockSize: scrollingElement[`scroll${blockSizeLabel}`],
      };

      layout.viewportScroll = {
        inline: reverseInlineCoordinates
          ? hostElementBounds[inlineStartLabel] -
            insetInlineStart +
            inlineScrollPosition(hostElement)
          : insetInlineStart -
            hostElementBounds[inlineStartLabel] +
            inlineScrollPosition(hostElement),
        block: reverseBlockCoordinates
          ? hostElementBounds[blockStartLabel] -
            insetBlockStart +
            blockScrollPosition(hostElement)
          : insetBlockStart -
            hostElementBounds[blockStartLabel] +
            blockScrollPosition(hostElement),
      };

      // Elements with zero width AND height are inside display:none (or
      // equivalent) and should render nothing.
      const isHidden =
        hostElementBounds.width === 0 && hostElementBounds.height === 0;

      if (this._isScroller) {
        const hasZeroSize =
          !isHidden &&
          (hostElementBounds.width === 0 || hostElementBounds.height === 0);
        this._warnings.warnOn(
          'zero-size',
          hasZeroSize,
          '[lit-virtualizer] The virtualizer host element has a zero-size ' +
            'dimension (width: ' +
            hostElementBounds.width +
            ', height: ' +
            hostElementBounds.height +
            '). ' +
            'A scroller-mode virtualizer needs explicit sizing via CSS. ' +
            'For example: `lit-virtualizer { block-size: 400px; }`'
        );
      }

      // When the host element has a zero dimension on a given axis but
      // isn't fully hidden, use a floor of 1px to bootstrap the rendering
      // cycle (newly-mounted elements may not have layout yet). Once the
      // host has a real size on an axis, trust the clipping result on
      // that axis — including zero when legitimately clipped by ancestors.
      type sizeKey = 'width' | 'height';
      const hostBlockDim =
        hostElementBounds[blockSizeLabel.toLowerCase() as sizeKey];
      const hostInlineDim =
        hostElementBounds[inlineSizeLabel.toLowerCase() as sizeKey];
      const blockFloor = !isHidden && hostBlockDim === 0 ? 1 : 0;
      const inlineFloor = !isHidden && hostInlineDim === 0 ? 1 : 0;

      const viewportBlockSize = Math.max(
        blockFloor,
        reverseBlockCoordinates
          ? insetBlockStart - insetBlockEnd
          : insetBlockEnd - insetBlockStart
      );
      const viewportInlineSize = Math.max(
        inlineFloor,
        reverseInlineCoordinates
          ? insetInlineStart - insetInlineEnd
          : insetInlineEnd - insetInlineStart
      );
      layout.viewportSize = {
        blockSize: viewportBlockSize,
        inlineSize: viewportInlineSize,
      };

      // @deprecated: When using legacy `direction` config, writingMode may
      // change after layout is created. Detect the change and set a flag
      // so that _updateLayout() knows to force a reflow.
      // This can be removed when the deprecated `direction` config option is removed.
      const previousWritingMode = layout.writingMode;
      layout.writingMode = writingMode;
      layout.direction = this._direction;
      if (
        previousWritingMode !== 'unknown' &&
        previousWritingMode !== writingMode
      ) {
        this._writingModeChanged = true;
      }
    }
  }

  /**
   * Styles the host element so that its size reflects the
   * total size of all items.
   */
  private _sizeHostElement(size: VirtualizerSize | null) {
    // Converts a VirtualizerSizeValue to a CSS value string.
    //
    // Plain numbers (block axis) → "Npx".
    //
    // Tuples [minOrMax, N] (cross axis) depend on mode:
    //   Scroller → "0px" (no cross-axis constraint needed).
    //   Non-scroller → "100%" (host follows its containing block).
    function cssScrollSizeValue(
      size: VirtualizerSizeValue,
      scroller = false
    ): string {
      if (typeof size === 'number') {
        return `${size}px`;
      }
      if (scroller) {
        return size[0] === 'min' ? `${size[1]}px` : '0px';
      }
      // For non-scroller cross axis, use 100% so the host follows its
      // containing block and reflows naturally on resize.
      return '100%';
    }
    let inline: string;
    let block: string;
    if (size === null) {
      // Don't set sizes when layout hasn't calculated them yet.
      // Setting to 0px would make the element have zero size with contain:size,
      // which prevents bootstrap of the rendering cycle.
      return;
    } else {
      inline = cssScrollSizeValue(size.inlineSize, this._isScroller);
      block = cssScrollSizeValue(size.blockSize, this._isScroller);
    }

    if (this._isScroller) {
      let h: string, v: string;
      if (this._writingMode === 'horizontal-tb') {
        v = block;
        h = this._direction === 'ltr' ? inline : `-${inline}`;
      } else {
        h = this._writingMode === 'vertical-lr' ? block : `-${block}`;
        v = this._direction === 'ltr' ? inline : `-${inline}`;
      }
      this._getSizer().style.transform = `translate(${h}, ${v})`;
    } else {
      const style = this._hostElement!.style;
      style.minInlineSize = inline;
      style.minBlockSize = block;
    }
  }

  /**
   * Sets the top and left transform style of the children from the values in
   * pos.
   */
  private _positionChildren(pos: ChildPositions | null) {
    if (pos && pos.size > 0) {
      const children = this._children;
      pos.forEach(
        ({insetBlockStart, insetInlineStart, blockSize, inlineSize}, index) => {
          const child = children[index - this._first];
          if (child) {
            child.style.position = 'absolute';
            child.style.boxSizing = 'border-box';

            const childLayoutInfo = this._childLayoutInfo?.get(index);
            if (childLayoutInfo) {
              if (
                isHorizontalWritingMode(childLayoutInfo.writingMode) !==
                isHorizontalWritingMode(this._writingMode)
              ) {
                const oInlineSize = inlineSize;
                inlineSize = blockSize;
                blockSize = oInlineSize;
              }
            }

            // When axis='inline', restore the child's writing-mode to the
            // context value so content renders in the natural document flow.
            // The existing flipAxis logic above handles the size swap that
            // results from the host/child writing-mode mismatch.
            if (this._axisWritingModeInjected) {
              child.style.writingMode = this._contextWritingMode;
            }

            let left, top;
            if (this._writingMode === 'horizontal-tb') {
              top = insetBlockStart;
              left =
                this._direction === 'ltr'
                  ? insetInlineStart
                  : -insetInlineStart;
            } else {
              if (this._writingMode === 'vertical-lr') {
                left = insetBlockStart;
              } else {
                // vertical-rl: scrollLeft is 0 at block-start (right edge),
                // negative values toward block-end (left). Use negative X.
                left = -insetBlockStart;
              }
              top =
                this._direction === 'ltr'
                  ? insetInlineStart
                  : -insetInlineStart;
            }

            if (this._childPositioningMethod === 'absolute') {
              child.style.left = left + 'px';
              child.style.top = top + 'px';
            } else {
              child.style.transform = `translate(${left}px, ${top}px)`;
            }

            if (inlineSize !== undefined) {
              child.style.inlineSize = inlineSize + 'px';
            }
            if (blockSize !== undefined) {
              child.style.blockSize = blockSize + 'px';
            }
          }
        }
      );
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
      const {block, inline} = this._scrollError;
      this._scrollError = null;
      // Whether to negate the block correction depends on the SCROLLER's writing-mode
      // (vertical-rl scrollers have inverted scrollLeft), not the host's.
      // Which axis (top vs left) the correction applies to depends on the HOST's writing-mode.
      const blockCorrection =
        this._scrollerWritingMode === 'vertical-rl' ? -block : block;
      this._scrollerController!.correctScrollError({
        top:
          scrollTop - (this._writingMode === 'horizontal-tb' ? block : inline),
        left:
          scrollLeft -
          (this._writingMode === 'horizontal-tb' ? inline : blockCorrection),
      });
      // Update _lastBlockScrollPosition so the freeze detection sees
      // the corrected position, not the pre-correction one. Without
      // this, large scroll corrections (e.g. from _pendingScrollCorrection)
      // appear as large user-initiated jumps and trigger an unwanted freeze.
      this._lastBlockScrollPosition = this._scrollerController!.scrollTop;
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
    if (options.index >= this._first && options.index <= this._last) {
      this._children[options.index - this._first].scrollIntoView(options);
    } else {
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

  public get layoutComplete(): Promise<void> {
    // Lazily create promise
    if (!this._layoutCompletePromise) {
      this._layoutCompletePromise = new Promise((resolve, reject) => {
        this._layoutCompleteResolver = resolve;
        this._layoutCompleteRejecter = reject;
      });
      // If a layout cycle already completed before this promise was
      // created (i.e. _scheduleLayoutComplete was called but couldn't
      // schedule because no promise existed), schedule resolution now.
      if (this._layoutCompleteScheduleNeeded) {
        this._layoutCompleteScheduleNeeded = false;
        this._scheduleLayoutComplete();
      }
    }
    return this._layoutCompletePromise;
  }

  private _rejectLayoutCompletePromise(reason: string) {
    if (this._layoutCompleteRejecter !== null) {
      this._layoutCompleteRejecter(reason);
    }
    this._layoutCompleteScheduleNeeded = false;
    this._resetLayoutCompleteState();
  }

  private _scheduleLayoutComplete() {
    if (this._layoutCompletePromise && this._pendingLayoutComplete === null) {
      // Wait one additional frame to be sure the layout is stable
      this._pendingLayoutComplete = requestAnimationFrame(() =>
        requestAnimationFrame(() => this._resolveLayoutCompletePromise())
      );
      this._layoutCompleteScheduleNeeded = false;
    } else if (!this._layoutCompletePromise) {
      // Layout cycle completed but no one is waiting yet. Record this
      // so we can schedule resolution when layoutComplete is accessed.
      this._layoutCompleteScheduleNeeded = true;
    }
  }

  private _resolveLayoutCompletePromise() {
    if (this._layoutCompleteResolver !== null) {
      this._layoutCompleteResolver();
    }
    // Mark that layout is stable so any future late access to
    // layoutComplete can be scheduled for immediate resolution.
    this._layoutCompleteScheduleNeeded = true;
    this._resetLayoutCompleteState();
  }

  private _resetLayoutCompleteState() {
    this._layoutCompletePromise = null;
    this._layoutCompleteResolver = null;
    this._layoutCompleteRejecter = null;
    this._pendingLayoutComplete = null;
  }

  /**
   * Render and update the view at the next opportunity with the given
   * hostElement size.
   */
  private _viewportSizeChanged() {
    this._schedule(this._updateLayout);
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
  private _childrenSizeChanged() {
    this._readLayoutInfo();
    this._scheduleLayoutComplete();
  }
}

function isHorizontalWritingMode(wm: writingMode): boolean {
  return wm === 'horizontal-tb';
}

function getMargins(
  el: Element,
  flipAxis = false,
  reverseDirection = false
): Margins {
  const style = window.getComputedStyle(el);
  if (flipAxis) {
    if (reverseDirection) {
      return {
        marginBlockStart: getMarginValue(style.marginInlineEnd),
        marginBlockEnd: getMarginValue(style.marginInlineStart),
        marginInlineStart: getMarginValue(style.marginBlockEnd),
        marginInlineEnd: getMarginValue(style.marginBlockStart),
      };
    } else {
      return {
        marginBlockStart: getMarginValue(style.marginInlineStart),
        marginBlockEnd: getMarginValue(style.marginInlineEnd),
        marginInlineStart: getMarginValue(style.marginBlockStart),
        marginInlineEnd: getMarginValue(style.marginBlockEnd),
      };
    }
  } else {
    if (reverseDirection) {
      return {
        marginBlockStart: getMarginValue(style.marginBlockEnd),
        marginBlockEnd: getMarginValue(style.marginBlockStart),
        marginInlineStart: getMarginValue(style.marginInlineEnd),
        marginInlineEnd: getMarginValue(style.marginInlineStart),
      };
    } else {
      return {
        marginBlockStart: getMarginValue(style.marginBlockStart),
        marginBlockEnd: getMarginValue(style.marginBlockEnd),
        marginInlineStart: getMarginValue(style.marginInlineStart),
        marginInlineEnd: getMarginValue(style.marginInlineEnd),
      };
    }
  }
}

function getMarginValue(value: string): number {
  const float = value ? parseFloat(value) : NaN;
  return Number.isNaN(float) ? 0 : float;
}

// TODO (graynorton): Deal with iframes?
function getParentElement(el: Element) {
  if (el.assignedSlot !== null) {
    return el.assignedSlot;
  }
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
  const ancestors: Array<HTMLElement> = [];
  let parent = includeSelf ? el : (getParentElement(el) as HTMLElement);
  while (parent !== null) {
    ancestors.push(parent);
    parent = getParentElement(parent) as HTMLElement;
  }
  return ancestors;
}

function getClippingAncestors(el: HTMLElement, includeSelf = false) {
  let foundFixed = false;
  return getElementAncestors(el, includeSelf).filter((a) => {
    if (foundFixed) {
      return false;
    }
    const style = getComputedStyle(a);
    foundFixed = style.position === 'fixed';
    // Elements with `display: contents` generate no box, so their
    // `overflow` value is meaningless and they cannot clip anything.
    // Exclude them to avoid collapsing the viewport to zero (their
    // getBoundingClientRect() returns a zero rect).
    if (style.display === 'contents') {
      return false;
    }
    return style.overflow !== 'visible';
  });
}
