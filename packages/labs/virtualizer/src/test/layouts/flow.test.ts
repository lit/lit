/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  array,
  first,
  last,
  ignoreBenignErrors,
  isInViewport,
  until,
} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {
  Layout,
  LayoutConstructor,
  LayoutSpecifier,
} from '../../layouts/shared/Layout.js';
import {VisibilityChangedEvent} from '../../events.js';
import {flow} from '../../layouts/flow.js';
import {expect, html, fixture} from '@open-wc/testing';

describe('flow layout', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  async function createVirtualizer<T>(properties: {
    items: T[];
    layout?: Layout | LayoutConstructor | LayoutSpecifier;
  }) {
    const container = await fixture(html` <div>
      <style>
        lit-virtualizer {
          height: 200px;
          width: 200px;
          margin: 0;
          padding: 0;
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
        .layout=${properties.layout || flow()}
        .items=${properties.items}
        .renderItem=${(item: T) => html`<div class="item">${item}</div>`}
      ></lit-virtualizer>
    </div>`);
    const virtualizer = (await until(() =>
      container.querySelector('lit-virtualizer')
    )) as LitVirtualizer;
    expect(virtualizer).to.be.instanceof(LitVirtualizer);
    await until(() => getVisibleItems(virtualizer).length === 4);
    return {container, virtualizer};
  }

  function getVisibleItems(virtualizer: LitVirtualizer) {
    return Array.from(virtualizer.renderRoot.querySelectorAll('.item')).filter(
      (e) => isInViewport(e, virtualizer)
    ) as HTMLElement[];
  }

  describe('item resizing', () => {
    it('emits VisibilityChanged event due to item resizing', async () => {
      const {container, virtualizer} = await createVirtualizer({
        items: array(1000),
      });
      const visibilityChangedEvents: VisibilityChangedEvent[] = [];

      await until(() => getVisibleItems(virtualizer).length == 4);

      container.addEventListener('visibilityChanged', (e) => {
        visibilityChangedEvents.push(e as VisibilityChangedEvent);
      });

      // Expanding the height of the first item from 50px to 100px should
      // cause the subsequent items to push down 50px.
      first(getVisibleItems(virtualizer)).style.height = '100px';

      await until(() => getVisibleItems(virtualizer).length == 3);
      await until(() => visibilityChangedEvents.length === 1);

      expect(last(visibilityChangedEvents).first).to.equal(0);
      expect(last(visibilityChangedEvents).last).to.equal(2);
      expect(last(getVisibleItems(virtualizer)).textContent).to.equal('2');

      // Contracting the height of the first item down to 10px from 100px should
      // cause the subsequent items to pull up 90px from current position, which
      // is 40px less than they started.
      first(getVisibleItems(virtualizer)).style.height = '10px';

      await until(() => getVisibleItems(virtualizer).length == 5);
      await until(() => visibilityChangedEvents.length === 2);

      expect(last(visibilityChangedEvents).first).to.equal(0);
      expect(last(visibilityChangedEvents).last).to.equal(4);
      expect(last(getVisibleItems(virtualizer)).textContent).to.equal('4');
    });
  });

  describe('scrollElementIntoView', () => {
    it('shows the correct items when scrolling to start position', async () => {
      const {virtualizer} = await createVirtualizer({items: array(1000)});

      virtualizer.scrollElementIntoView({index: 5, block: 'start'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '5')
      );

      const visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('5');
      expect(last(visible).textContent).to.equal('8');
    });

    it('shows leading items when scrolling to last item in start position', async () => {
      const {virtualizer} = await createVirtualizer({items: array(1000)});

      virtualizer.scrollElementIntoView({index: 999, block: 'start'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '999')
      );

      const visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('996');
      expect(last(visible).textContent).to.equal('999');
    });

    it('shows the correct items when scrolling to center position', async () => {
      const {virtualizer} = await createVirtualizer({items: array(1000)});

      virtualizer.scrollElementIntoView({index: 200, block: 'center'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '200')
      );

      // 5 items are visible, but the first and last items are only half-visible.
      const visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(5);
      expect(first(visible).textContent).to.equal('198');
      expect(last(visible).textContent).to.equal('202');
    });

    it('shows trailing items when scrolling to first item in end position', async () => {
      const {virtualizer} = await createVirtualizer({items: array(1000)});
      virtualizer.scrollElementIntoView({index: 0, block: 'end'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '0')
      );

      const visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('0');
      expect(last(visible).textContent).to.equal('3');
    });

    it('shows the correct items when scrolling to nearest position', async () => {
      const {virtualizer} = await createVirtualizer({items: array(1000)});

      // The nearest position for item 500 will be at the end.
      virtualizer.scrollElementIntoView({index: 500, block: 'nearest'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '500')
      );

      let visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('497');
      expect(last(visible).textContent).to.equal('500');

      // The nearest position for item 3 will be at the start.
      virtualizer.scrollElementIntoView({index: 300, block: 'nearest'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '300')
      );

      visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('300');
      expect(last(visible).textContent).to.equal('303');

      // No change in visible items is expected since item 5 is already visible.
      virtualizer.scrollElementIntoView({index: 302, block: 'nearest'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '302')
      );

      visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('300');
      expect(last(visible).textContent).to.equal('303');
    });
  });
});
