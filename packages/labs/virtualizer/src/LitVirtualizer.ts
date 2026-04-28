/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, LitElement} from 'lit';
import {property} from 'lit/decorators/property.js';
import {KeyFn} from 'lit/directives/repeat.js';
import {
  LayoutConfigValue,
  PinOptions,
  virtualizerAxis,
} from './layouts/shared/Layout.js';
import {
  virtualize,
  virtualizerRef,
  VirtualizerHostElement,
  defaultRenderItem,
  defaultKeyFunction,
  RenderItemFunction,
} from './virtualize.js';

export class LitVirtualizer<T = unknown> extends LitElement {
  @property({attribute: false})
  items: T[] = [];

  @property()
  renderItem: RenderItemFunction<T> = defaultRenderItem;

  @property()
  keyFunction: KeyFn<T> = defaultKeyFunction;

  @property({attribute: false})
  layout: LayoutConfigValue = {};

  @property({reflect: true, type: Boolean})
  scroller = false;

  /**
   * Controls which CSS logical axis the virtualizer scrolls along.
   * - `'block'` (default): virtualizes along the block axis.
   * - `'inline'`: virtualizes along the inline axis (e.g., for a
   *   horizontal carousel in a vertical document).
   */
  @property({reflect: true})
  axis: virtualizerAxis = 'block';

  /**
   * Declaratively pin the viewport to a specific item. The viewport will
   * remain pinned until the user scrolls, at which point the virtualizer
   * fires an `unpinned` event.
   */
  @property({attribute: false})
  pin: PinOptions | undefined;

  createRenderRoot() {
    return this;
  }

  render() {
    const {items, renderItem, keyFunction, layout, scroller, axis, pin} = this;
    return html`${virtualize({
      items,
      renderItem,
      keyFunction,
      layout,
      scroller,
      axis,
      pin,
    })}`;
  }

  element(index: number) {
    return (this as VirtualizerHostElement)[virtualizerRef]?.element(index);
  }

  get layoutComplete() {
    return (this as VirtualizerHostElement)[virtualizerRef]?.layoutComplete;
  }

  /**
   * This scrollToIndex() shim is here to provide backwards compatibility with other 0.x versions of
   * lit-virtualizer. It is deprecated and will likely be removed in the 1.0.0 release.
   */
  scrollToIndex(
    index: number,
    position: 'start' | 'center' | 'end' | 'nearest' = 'start'
  ) {
    this.element(index)?.scrollIntoView({block: position});
  }
}
