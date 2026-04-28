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
import type {Viewport} from './Virtualizer.js';

export class LitVirtualizer<T = unknown> extends LitElement {
  @property({attribute: false})
  items: T[] = [];

  @property()
  renderItem: RenderItemFunction<T> = defaultRenderItem;

  @property()
  keyFunction: KeyFn<T> = defaultKeyFunction;

  @property({attribute: false})
  layout: LayoutConfigValue = {};

  /**
   * Controls how the virtualizer acquires scroll position and viewport
   * size. Three modes are supported:
   *
   * - `'ancestor'` (default, also `false`): the window or a clipping
   *   ancestor is the scroll container.
   * - `'self'` (also `true`): the host element itself is the scroll
   *   container; the host must be explicitly sized via CSS.
   * - `'managed'`: the virtualizer performs no DOM observation for
   *   scroll or viewport. An external controller must set the
   *   `viewport` property to drive the virtualizer.
   *
   * The boolean values are accepted for backwards compatibility:
   * `true` ↔ `'self'`, `false` ↔ `'ancestor'`. New code should prefer
   * the string form.
   *
   * Setting via attribute supports both forms — e.g.
   * `<lit-virtualizer scroller>` (boolean form, equivalent to
   * `'self'`) or `<lit-virtualizer scroller="managed">`.
   */
  @property({
    reflect: true,
    converter: {
      fromAttribute(value: string | null): boolean | string {
        if (value === null) return false;
        // A bare attribute (`<lit-virtualizer scroller>`) yields '' —
        // treat that as the boolean `true` form (equivalent to 'self').
        if (value === '' || value === 'true') return true;
        if (value === 'false') return false;
        return value;
      },
      toAttribute(value: boolean | string): string | null {
        if (typeof value === 'string') return value;
        return value ? '' : null;
      },
    },
  })
  scroller: boolean | 'self' | 'ancestor' | 'managed' = false;

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

  /**
   * Required when `scroller` is `'managed'`. Provides the externally-
   * managed viewport (scroll position and dimensions) that the
   * virtualizer should use in place of DOM-observed values. Setting
   * this property updates the underlying virtualizer and schedules a
   * layout update.
   */
  @property({attribute: false})
  viewport: Viewport | undefined;

  createRenderRoot() {
    return this;
  }

  render() {
    const {
      items,
      renderItem,
      keyFunction,
      layout,
      scroller,
      axis,
      pin,
      viewport,
    } = this;
    return html`${virtualize({
      items,
      renderItem,
      keyFunction,
      layout,
      scroller,
      axis,
      pin,
      viewport,
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
