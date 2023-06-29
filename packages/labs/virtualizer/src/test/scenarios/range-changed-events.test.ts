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

  async function createVirtualizer<T>(properties: {items: T[]}) {
    const container = await fixture(html` <div>
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
        .renderItem=${(item: T) => html`<div class="item">${item}</div>`}
      ></lit-virtualizer>
    </div>`);
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

    // The overhang (i.e. length-in-pixels of rendered DOM that are outside
    // the viewport) is currently baked in at 1000px, which means there
    // should be 20 items rendered above and below the first and last
    // visible items.
    expect(last(virtualizerEvents).first).to.eq(480);
    expect(last(virtualizerEvents).last).to.eq(523);

    // The rangechanged event should not bubble up to its containing element.
    expect(containerEvents.length).to.equal(0);
  });
});
