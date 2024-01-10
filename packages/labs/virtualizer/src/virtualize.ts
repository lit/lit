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
import {LayoutConfigValue} from './layouts/shared/Layout.js';

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

  // TODO (graynorton): Document...
  layout?: LayoutConfigValue;

  /**
   * The list of items to display via the renderItem function.
   */
  items?: Array<T>;
}

export type RenderItemFunction<T = unknown> = (
  item: T,
  index: number
) => TemplateResult;

export const defaultKeyFunction: KeyFn<unknown> = (item: unknown) => item;
export const defaultRenderItem: RenderItemFunction<unknown> = (
  item: unknown,
  idx: number
) => html`${idx}: ${JSON.stringify(item, null, 2)}`;

class VirtualizeDirective<T = unknown> extends AsyncDirective {
  _virtualizer: Virtualizer | null = null;
  _first = 0;
  _last = -1;
  _renderItem: RenderItemFunction<T> = (item: T, idx: number) =>
    defaultRenderItem(item, idx + this._first);
  _keyFunction: KeyFn<T> = (item: T, idx: number) =>
    defaultKeyFunction(item, idx + this._first);
  _items: Array<T> = [];

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
    const itemsToRender: Array<T> = [];

    if (this._first >= 0 && this._last >= this._first) {
      for (let i = this._first; i <= this._last; i++) {
        itemsToRender.push(this._items[i]);
      }
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
    this._virtualizer!.items = this._items;
  }

  private _setFunctions(config: VirtualizeDirectiveConfig<T>) {
    const {renderItem, keyFunction} = config;
    if (renderItem) {
      this._renderItem = (item, idx) => renderItem(item, idx + this._first);
    }
    if (keyFunction) {
      this._keyFunction = (item, idx) => keyFunction(item, idx + this._first);
    }
  }

  private _makeVirtualizer(
    hostElement: HTMLElement,
    config: VirtualizeDirectiveConfig<T>
  ) {
    if (this._virtualizer) {
      this._virtualizer.disconnected();
    }
    const {layout, scroller, items} = config;
    this._virtualizer = new Virtualizer({hostElement, layout, scroller});
    this._virtualizer.items = items;
    this._virtualizer.connected();
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
