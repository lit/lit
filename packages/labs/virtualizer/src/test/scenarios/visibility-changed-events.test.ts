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
  pass,
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

    await pass(() => expect(getVisibleItems(virtualizer).length).to.equal(4));

    container.addEventListener('visibilityChanged', (e) => {
      containerEvents.push(e as VisibilityChangedEvent);
    });

    virtualizer.addEventListener('visibilityChanged', (e) => {
      virtualizerEvents.push(e as VisibilityChangedEvent);
    });

    first(getVisibleItems(virtualizer)).style.height = '10px';

    await pass(() => expect(virtualizerEvents.length).to.equal(1));

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

    await pass(() => expect(getVisibleItems(virtualizer).length).to.equal(4));

    container.addEventListener('visibilityChanged', (e) => {
      containerEvents.push(e as VisibilityChangedEvent);
    });

    virtualizer.addEventListener('visibilityChanged', (e) => {
      virtualizerEvents.push(e as VisibilityChangedEvent);
    });

    first(getVisibleItems(virtualizer)).style.height = '100px';

    await pass(() => expect(virtualizerEvents.length).to.equal(1));

    expect(last(virtualizerEvents).first).to.equal(0);
    expect(last(virtualizerEvents).last).to.equal(2);

    // The visibilitychanged event should not bubble up to its containing element.
    expect(containerEvents.length).to.equal(0);
  });

  it('should fire visibilityChanged even when other state (e.g, range) does not change', async () => {
    const items = array(1000);
    const {virtualizer} = await createVirtualizer({items});
    const virtualizerEvents: VisibilityChangedEvent[] = [];

    virtualizer.addEventListener('visibilityChanged', (e) => {
      virtualizerEvents.push(e as VisibilityChangedEvent);
    });

    await new Promise(requestAnimationFrame);
    await pass(() => expect(virtualizerEvents.length).to.be.greaterThan(0));

    expect(last(virtualizerEvents).first).to.equal(0);

    virtualizer.scrollTo({top: 1000, behavior: 'smooth'});
    await pass(() => expect(virtualizer.scrollTop).to.equal(1000));
    expect(last(virtualizerEvents).first).to.be.greaterThan(0);

    virtualizer.scrollTo({top: 0, behavior: 'smooth'});
    await pass(() => expect(virtualizer.scrollTop).to.equal(0));
    expect(last(virtualizerEvents).first).to.equal(0);
  });
});
