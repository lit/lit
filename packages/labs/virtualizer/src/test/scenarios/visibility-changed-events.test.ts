/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  array,
  first,
  ignoreBenignErrors,
  isInViewport,
  last,
  until,
} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {VisibilityChangedEvent} from '../../events.js';
import {expect, html, fixture} from '@open-wc/testing';

describe('VisibilityChanged event', () => {
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
    const virtualizer = (await until(() =>
      container.querySelector('lit-virtualizer')
    )) as LitVirtualizer;
    expect(virtualizer).to.be.instanceof(LitVirtualizer);
    return {container, virtualizer};
  }

  function getVisibleItems(virtualizer: LitVirtualizer) {
    return Array.from(virtualizer.renderRoot.querySelectorAll('.item')).filter(
      (e) => isInViewport(e, virtualizer)
    ) as HTMLElement[];
  }

  it('should fire when item moves into view', async () => {
    const items = array(1000);
    const {container, virtualizer} = await createVirtualizer({items});
    const containerEvents: VisibilityChangedEvent[] = [];
    const virtualizerEvents: VisibilityChangedEvent[] = [];

    await until(() => getVisibleItems(virtualizer).length === 4);

    container.addEventListener('visibilityChanged', (e) => {
      containerEvents.push(e as VisibilityChangedEvent);
    });

    virtualizer.addEventListener('visibilityChanged', (e) => {
      virtualizerEvents.push(e as VisibilityChangedEvent);
    });

    first(getVisibleItems(virtualizer)).style.height = '10px';

    await until(() => virtualizerEvents.length === 1);

    expect(last(virtualizerEvents).first).to.equal(0);
    expect(last(virtualizerEvents).last).to.equal(4);

    // The visibilitychanged event should not bubble up to its containing element.
    expect(containerEvents.length).to.equal(0);
  });

  it('should fire when item moves out of view', async () => {
    const items = array(1000);
    const {container, virtualizer} = await createVirtualizer({items});
    const containerEvents: VisibilityChangedEvent[] = [];
    const virtualizerEvents: VisibilityChangedEvent[] = [];

    await until(() => getVisibleItems(virtualizer).length === 4);

    container.addEventListener('visibilityChanged', (e) => {
      containerEvents.push(e as VisibilityChangedEvent);
    });

    virtualizer.addEventListener('visibilityChanged', (e) => {
      virtualizerEvents.push(e as VisibilityChangedEvent);
    });

    first(getVisibleItems(virtualizer)).style.height = '100px';

    await until(() => virtualizerEvents.length === 1);

    expect(last(virtualizerEvents).first).to.equal(0);
    expect(last(virtualizerEvents).last).to.equal(2);

    // The visibilitychanged event should not bubble up to its containing element.
    expect(containerEvents.length).to.equal(0);
  });
});
