/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {TemplateResult, ChildPart, html, noChange} from 'lit';
import {directive, DirectiveResult, PartInfo, PartType} from 'lit/directive.js';
import {AsyncDirective} from 'lit/async-directive.js';
import {repeat, KeyFn} from 'lit/directives/repeat.js';
import {Virtualizer} from './Virtualizer.js';
import {RangeChangedEvent} from './events.js';
import {recycledList} from './RecycledList.js';
import {issueWarning} from './warnings.js';
import {
  LayoutConfigValue,
  PinOptions,
  virtualizerAxis,
} from './layouts/shared/Layout.js';

export {virtualizerRef, VirtualizerHostElement} from './Virtualizer.js';

/**
 * Configuration options for the virtualize directive.
 */
export interface VirtualizeDirectiveConfig<T> {
  /**
   * A function that returns a lit-html TemplateResult. It will be used
   * to generate the DOM for each item in the virtual list.
   */
  renderItem?: RenderItemFunction<T>;

  keyFunction?: KeyFn<T>;

  scroller?: boolean;

  /**
   * Opt in to recycled rendering mode. When `true`, the virtualizer
   * maintains a fixed pool of row elements and keeps each pooled
   * element assigned to the same item across scrolls whenever
   * possible, so a typical scroll step only re-renders the one slot
   * whose item cycles at the buffer edge. This can dramatically
   * reduce per-scroll work for lists whose rows contain expensive
   * custom elements.
   *
   * Opting in changes the contract in several ways — see the
   * `README.md` "Recycled mode" section for the full list, but the
   * short version:
   *
   * - `renderItem` **must** express per-row state through bindings
   *   on the item data. Row components will be reused across items,
   *   so any state initialized in the row's constructor or lifecycle
   *   hooks will persist across reuses.
   * - Focus on a sub-element of a reused row will appear to "jump"
   *   to the new item. Callers that put focusable content in rows
   *   are responsible for handling focus on reuse.
   * - A custom `keyFunction` is ignored in recycled mode (the pool
   *   uses slot identity, not item keys). A one-time dev warning is
   *   emitted if both are set.
   * - Heterogeneous rows (items whose templates have different
   *   structure) work correctly but lose the reuse benefit at the
   *   boundary.
   */
  recycle?: boolean;

  /**
   * Controls how much content beyond the viewport to keep rendered.
   * A normalized value from 0 to 100, where 0 renders only visible items
   * and 100 renders one full extra viewport on each side (3× total coverage).
   * Default: 50 (half a viewport on each side, 2× total coverage —
   * approximately matching iron-list's default behavior).
   *
   * The internal mapping from this normalized value to pixels may be refined
   * in future versions without changing the 0–100 scale.
   *
   * In recycled mode, `overscan` also controls the pool size: larger values
   * allocate more pool slots, which reduces reassignments at buffer edges.
   */
  overscan?: number;

  // TODO (graynorton): Document...
  layout?: LayoutConfigValue;

  /**
   * The list of items to display via the renderItem function.
   */
  items?: Array<T>;

  /**
   * Controls which CSS logical axis the virtualizer scrolls along.
   * - `'block'` (default): virtualizes along the block axis.
   * - `'inline'`: virtualizes along the inline axis.
   */
  axis?: virtualizerAxis;

  /**
   * Declaratively pin the viewport to a specific item. The viewport will
   * remain pinned until the user scrolls, at which point the virtualizer
   * fires an `unpinned` event.
   */
  pin?: PinOptions;
}

export type RenderItemFunction<T = unknown> = (
  item: T,
  index: number
) => TemplateResult;

export const defaultKeyFunction: KeyFn<unknown> = (_item, index) => index;
export const defaultRenderItem: RenderItemFunction<unknown> = (
  item: unknown,
  idx: number
) => html`${idx}: ${JSON.stringify(item, null, 2)}`;

class VirtualizeDirective<T = unknown> extends AsyncDirective {
  _virtualizer: Virtualizer | null = null;
  _first = 0;
  _last = -1;
  // `_renderItem` / `_keyFunction` are wrapped to translate the
  // repeat directive's local-to-array indices into absolute item
  // indices before invoking the user-provided callbacks. The recycled
  // path receives absolute indices directly from `recycledList`, so
  // it uses `_userRenderItem` — the raw (or default) user function.
  _renderItem: RenderItemFunction<T> = (item: T, idx: number) =>
    defaultRenderItem(item, idx + this._first);
  _keyFunction: KeyFn<T> = (item: T, idx: number) =>
    defaultKeyFunction(item, idx + this._first);
  _userRenderItem: RenderItemFunction<T> = defaultRenderItem;
  _items: Array<T> = [];
  _recycle = false;

  constructor(part: PartInfo) {
    super(part);
    if (part.type !== PartType.CHILD) {
      throw new Error(
        'The virtualize directive can only be used in child expressions'
      );
    }
  }

  render(config?: VirtualizeDirectiveConfig<T>) {
    if (config) {
      this._setFunctions(config);
    }
    if (this._first < 0 || this._last < this._first) {
      // Empty range on the first render before the layout has run;
      // `repeat` with an empty array is fine and `recycledList` will
      // no-op on an empty range too.
      return repeat<T>([], this._keyFunction, this._renderItem);
    }
    if (this._recycle) {
      // Recycled path: hand the full items array + absolute range to
      // the `recycledList` directive, which maintains its own pool
      // and commits only to slots whose item assignments changed.
      // The `recycledList` directive invokes `renderItem` with
      // absolute item indices, which is what the raw user function
      // expects — unlike the `repeat` path, we don't need to
      // translate from local-to-array indices.
      return recycledList<T>({
        items: this._items,
        first: this._first,
        last: this._last,
        renderItem: this._userRenderItem,
      });
    }
    const itemsToRender: Array<T> = [];
    for (let i = this._first; i <= this._last; i++) {
      itemsToRender.push(this._items[i]);
    }
    return repeat(itemsToRender, this._keyFunction, this._renderItem);
  }

  update(part: ChildPart, [config]: [VirtualizeDirectiveConfig<T>]) {
    this._setFunctions(config);
    const itemsChanged = this._items !== config.items;
    this._items = config.items || [];
    if (this._virtualizer) {
      this._updateVirtualizerConfig(part, config);
    } else {
      this._initialize(part, config);
    }
    return itemsChanged ? noChange : this.render();
  }

  private async _updateVirtualizerConfig(
    part: ChildPart,
    config: VirtualizeDirectiveConfig<T>
  ) {
    const compatible = await this._virtualizer!.updateLayoutConfig(
      config.layout || {}
    );
    if (!compatible) {
      const hostElement = part.parentNode as HTMLElement;
      this._makeVirtualizer(hostElement, config);
    }
    this._virtualizer!.axis = config.axis ?? 'block';
    this._virtualizer!.pin = config.pin;
    if (config.overscan !== undefined) {
      this._virtualizer!.overscan = config.overscan;
    }
    this._virtualizer!.items = this._items;
    // @deprecated: If we just set a legacy direction config, wait for layout
    // to complete processing the new writing-mode before returning.
    // This can be removed when the deprecated `direction` config option is removed.
    if (
      config.layout &&
      'direction' in config.layout &&
      (config.layout as {direction?: string}).direction
    ) {
      await this._virtualizer!.layoutComplete;
    }
  }

  private _setFunctions(config: VirtualizeDirectiveConfig<T>) {
    const {renderItem, keyFunction, recycle} = config;
    if (renderItem) {
      this._userRenderItem = renderItem;
      this._renderItem = (item, idx) => renderItem(item, idx + this._first);
    }
    if (keyFunction) {
      this._keyFunction = (item, idx) => keyFunction(item, idx + this._first);
    }
    this._recycle = recycle === true;
    if (this._recycle && keyFunction) {
      issueWarning(
        'virtualize-recycle-with-keyfunction',
        '[lit-virtualizer] `keyFunction` is ignored when `recycle: true` is set. ' +
          'Recycled mode manages its own slot identity, so custom key ' +
          'functions have no effect in that mode.'
      );
    }
  }

  private _makeVirtualizer(
    hostElement: HTMLElement,
    config: VirtualizeDirectiveConfig<T>
  ) {
    if (this._virtualizer) {
      this._virtualizer.disconnected();
    }
    const {layout, scroller, items, axis, pin, overscan} = config;
    const virtualizer = (this._virtualizer = new Virtualizer({
      hostElement,
      layout,
      scroller,
      axis,
      pin,
      overscan,
    }));
    virtualizer.items = items;
    // On initial render, lit-html runs directives while the new DOM is
    // still in an unattached DocumentFragment, so the host element is not
    // yet connected to the document. `Virtualizer.connected()` reads
    // ancestor computed styles to detect clipping ancestors, which returns
    // empty values for disconnected elements and produces a wrong list.
    // Defer until the host is actually attached.
    if (hostElement.isConnected) {
      virtualizer.connected();
    } else {
      queueMicrotask(() => {
        // Skip if we've been replaced or torn down in the interim.
        if (this._virtualizer === virtualizer && hostElement.isConnected) {
          virtualizer.connected();
        }
      });
    }
  }

  private _initialize(part: ChildPart, config: VirtualizeDirectiveConfig<T>) {
    const hostElement = part.parentNode as HTMLElement;
    if (hostElement && hostElement.nodeType === 1) {
      hostElement.addEventListener('rangeChanged', (e: RangeChangedEvent) => {
        this._first = e.first;
        this._last = e.last;
        this.setValue(this.render());
      });
      this._makeVirtualizer(hostElement, config);
    }
  }

  disconnected() {
    this._virtualizer?.disconnected();
  }

  reconnected() {
    this._virtualizer?.connected();
  }
}

export const virtualize = directive(VirtualizeDirective) as <T>(
  config?: VirtualizeDirectiveConfig<T>
) => DirectiveResult<typeof VirtualizeDirective>;
