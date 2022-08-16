/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, LitElement, TemplateResult} from 'lit';
import {property} from 'lit/decorators/property.js';
import {state} from 'lit/decorators/state.js';
import {repeat} from 'lit/directives/repeat.js';
import {
  Virtualizer,
  VirtualizerHostElement,
  virtualizerRef,
  PinOptions,
  ScrollElementIntoViewOptions,
} from './Virtualizer.js';
import {RangeChangedEvent} from './events.js';
import {
  LayoutSpecifier,
  Layout,
  LayoutConstructor,
} from './layouts/shared/Layout.js';

type RenderItemFunction = <T>(item: T, index: number) => TemplateResult;
const defaultKeyFunction = <T>(item: T) => item;
const defaultRenderItem: RenderItemFunction = <T>(item: T, idx: number) =>
  html`${idx}: ${JSON.stringify(item, null, 2)}`;

export class LitVirtualizer extends LitElement {
  private _renderItem: RenderItemFunction = (item, idx) =>
    defaultRenderItem(item, idx + this._first);
  private _providedRenderItem: RenderItemFunction = defaultRenderItem;

  set renderItem(fn: RenderItemFunction) {
    this._providedRenderItem = fn;
    this._renderItem = (item, idx) => fn(item, idx + this._first);
    this.requestUpdate();
  }

  @property()
  get renderItem() {
    return this._providedRenderItem;
  }

  @property({attribute: false})
  items: Array<unknown> = [];

  @property({reflect: true, type: Boolean})
  scroller = false;

  @property()
  keyFunction: ((item: unknown) => unknown) | undefined = defaultKeyFunction;

  @state()
  private _first = 0;

  @state()
  private _last = -1;

  private _layout?: Layout | LayoutConstructor | LayoutSpecifier | null;

  private _pin: PinOptions | null = null;

  private _virtualizer?: Virtualizer;

  @property({attribute: false})
  set layout(layout: Layout | LayoutConstructor | LayoutSpecifier | null) {
    this._layout = layout;
    if (layout && this._virtualizer) {
      this._virtualizer.layout = layout;
    }
  }

  get layout(): Layout | LayoutConstructor | LayoutSpecifier | null {
    return (this as VirtualizerHostElement)[virtualizerRef]!.layout;
  }

  @property({attribute: false})
  set pin(value: PinOptions) {
    this._pin = value;
    if (this._virtualizer) {
      this._virtualizer.pin = value;
    }
  }

  /**
   * Scroll to the specified index, placing that item at the given position
   * in the scroll view.
   */
  scrollElementIntoView(options: ScrollElementIntoViewOptions) {
    if (this._virtualizer) {
      this._virtualizer.scrollElementIntoView(options);
    }
  }

  // scrollTo(options: ScrollToOptions): void;
  // scrollTo(x: number, y: number): void;
  // scrollTo(p1: ScrollToOptions | number, p2?: number) {
  //   if (this._virtualizer) {
  //     this._virtualizer.scrollTo(p1, p2);
  //   }
  // }

  willUpdate(changed: Map<string, unknown>) {
    if (this._virtualizer) {
      if (changed.has('layout')) {
        this._virtualizer.layout = this._layout!;
      }
      if (changed.has('items')) {
        this._virtualizer.items = this.items;
      }
    }
  }

  _init() {
    const layout = this._layout;
    const pin = this._pin;
    this._virtualizer = new Virtualizer({
      hostElement: this,
      layout,
      pin,
      scroller: this.scroller,
    });
    this.addEventListener('rangeChanged', (e: RangeChangedEvent) => {
      e.stopPropagation();
      this._first = e.first;
      this._last = e.last;
    });
    this._virtualizer.items = this.items;
    this._virtualizer.connected();
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._virtualizer) {
      this._virtualizer.connected();
    } else {
      this._init();
    }
  }

  disconnectedCallback() {
    if (this._virtualizer) {
      this._virtualizer.disconnected();
    }
    super.disconnectedCallback();
  }

  createRenderRoot() {
    return this;
  }

  render(): TemplateResult {
    const {items, _renderItem, keyFunction} = this;
    const itemsToRender = [];
    // TODO (graynorton): Is this the best / only place to ensure
    // that _last isn't outside the current bounds of the items array?
    // Not sure we should ever arrive here with it out of bounds.
    // Repro case for original issue: https://tinyurl.com/yes8b2e6
    const lastItem = Math.min(items.length, this._last + 1);

    if (this._first >= 0 && this._last >= this._first) {
      for (let i = this._first; i < lastItem; i++) {
        itemsToRender.push(items[i]);
      }
    }

    return repeat(
      itemsToRender,
      keyFunction || defaultKeyFunction,
      _renderItem
    ) as TemplateResult;
  }
}
