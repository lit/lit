/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  array,
  ignoreBenignErrors,
  isInViewport,
  last,
  pass,
  until,
} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {RangeChangedEvent} from '../../events.js';
import {expect, html, fixture} from '@open-wc/testing';

describe('RangeChanged event', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  async function createVirtualizer<T>(properties: {
    items: T[];
    overscan?: number;
  }) {
    const container = await fixture(
      html` <div>
        <style>
          lit-virtualizer {
            height: 200px;
            width: 200px;
          }
          .item {
            width: 200px;
            height: 50px;
            margin: 0;
            padding: 0;
          }
        </style>
        <lit-virtualizer
          scroller
          .items=${properties.items}
          .overscan=${properties.overscan}
          .renderItem=${(item: T) => html`<div class="item">${item}</div>`}
        ></lit-virtualizer>
      </div>`
    );
    const virtualizer = await until(
      () => container.querySelector('lit-virtualizer') as LitVirtualizer
    );
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);
    return {container, virtualizer};
  }

  function getVisibleItems(virtualizer: LitVirtualizer) {
    return Array.from(virtualizer.renderRoot.querySelectorAll('.item')).filter(
      (e) => isInViewport(e, virtualizer)
    ) as HTMLElement[];
  }

  it('should fire when rendered items have changed', async () => {
    const items = array(1000);
    const {container, virtualizer} = await createVirtualizer({items});
    const containerEvents: RangeChangedEvent[] = [];
    const virtualizerEvents: RangeChangedEvent[] = [];

    await pass(() => expect(getVisibleItems(virtualizer).length).to.equal(4));

    container.addEventListener('rangeChanged', (e) => {
      containerEvents.push(e as RangeChangedEvent);
    });

    virtualizer.addEventListener('rangeChanged', (e) => {
      virtualizerEvents.push(e as RangeChangedEvent);
    });

    virtualizer.element(500)!.scrollIntoView();

    await pass(() => expect(virtualizerEvents.length).to.equal(1));

    // The overscan default is 50, and the viewport is 200px tall, so the
    // computed overscan buffer is Math.round(50/100 * 200) = 100px = 2 items
    // (each item is 50px). The range should extend 2 items beyond the
    // viewport on each side.
    expect(last(virtualizerEvents).first).to.eq(498);
    expect(last(virtualizerEvents).last).to.eq(505);

    // The rangechanged event should not bubble up to its containing element.
    expect(containerEvents.length).to.equal(0);
  });

  it('overscan: 0 renders only the visible range', async () => {
    const items = array(1000);
    const {virtualizer} = await createVirtualizer({items, overscan: 0});
    const virtualizerEvents: RangeChangedEvent[] = [];

    // Wait for initial render to settle before attaching the listener,
    // matching the pattern in the test above so initial rangeChanged
    // events don't count against our expected post-scroll count of 1.
    await pass(() => expect(getVisibleItems(virtualizer).length).to.equal(4));

    virtualizer.addEventListener('rangeChanged', (e) => {
      virtualizerEvents.push(e as RangeChangedEvent);
    });

    virtualizer.element(500)!.scrollIntoView();

    await pass(() => expect(virtualizerEvents.length).to.equal(1));

    // overscan: 0, viewport: 200px → no buffer beyond the viewport.
    // 200px / 50px per item = 4 items visible. With scroll position at
    // item 500 (top), range is exactly [500, 503].
    expect(last(virtualizerEvents).first).to.eq(500);
    expect(last(virtualizerEvents).last).to.eq(503);
  });

  it('overscan: 100 renders a full extra viewport on each side', async () => {
    const items = array(1000);
    const {virtualizer} = await createVirtualizer({items, overscan: 100});
    const virtualizerEvents: RangeChangedEvent[] = [];

    // Wait for initial render to settle (and layout to initialize) before
    // attaching the listener and scrolling.
    await pass(() => expect(getVisibleItems(virtualizer).length).to.equal(4));

    virtualizer.addEventListener('rangeChanged', (e) => {
      virtualizerEvents.push(e as RangeChangedEvent);
    });

    virtualizer.element(500)!.scrollIntoView();

    await pass(() => expect(virtualizerEvents.length).to.equal(1));

    // overscan: 100, viewport: 200px → buffer = Math.round(100/100 * 200) = 200px
    // = 4 items on each side of the 4-item viewport. Range is [496, 507].
    expect(last(virtualizerEvents).first).to.eq(496);
    expect(last(virtualizerEvents).last).to.eq(507);
  });
});
