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
  pass,
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
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);
    await pass(() => expect(getVisibleItems(virtualizer).length).to.equal(4));
    return virtualizer;
  }

  function getVisibleItems(virtualizer: LitVirtualizer) {
    return Array.from(virtualizer.renderRoot.querySelectorAll('.item')).filter(
      (e) => isInViewport(e, virtualizer)
    ) as HTMLElement[];
  }

  describe('item resizing', () => {
    it('emits VisibilityChanged event due to item resizing', async () => {
      const virtualizer = await createVirtualizer({
        items: array(1000),
      });
      const visibilityChangedEvents: VisibilityChangedEvent[] = [];

      await pass(() => expect(getVisibleItems(virtualizer).length).to.equal(4));

      virtualizer.addEventListener('visibilityChanged', (e) => {
        visibilityChangedEvents.push(e as VisibilityChangedEvent);
      });

      // Expanding the height of the first item from 50px to 100px should
      // cause the subsequent items to push down 50px.
      first(getVisibleItems(virtualizer)).style.height = '100px';

      await pass(() => expect(getVisibleItems(virtualizer).length).to.equal(3));
      await pass(() => expect(visibilityChangedEvents.length).to.equal(1));

      expect(last(visibilityChangedEvents).first).to.equal(0);
      expect(last(visibilityChangedEvents).last).to.equal(2);
      expect(last(getVisibleItems(virtualizer)).textContent).to.equal('2');

      // Contracting the height of the first item down to 10px from 100px should
      // cause the subsequent items to pull up 90px from current position, which
      // is 40px less than they started.
      first(getVisibleItems(virtualizer)).style.height = '10px';

      await pass(() => expect(getVisibleItems(virtualizer).length).to.equal(5));
      await pass(() => expect(visibilityChangedEvents.length).to.equal(2));

      expect(last(visibilityChangedEvents).first).to.equal(0);
      expect(last(visibilityChangedEvents).last).to.equal(4);
      expect(last(getVisibleItems(virtualizer)).textContent).to.equal('4');
    });
  });

  describe('element(<index>).scrollIntoView', () => {
    it('shows the correct items when scrolling to start position', async () => {
      const virtualizer = await createVirtualizer({items: array(1000)});

      virtualizer.element(5)!.scrollIntoView({block: 'start'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '5')
      );

      const visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('5');
      expect(last(visible).textContent).to.equal('8');
    });

    it('shows leading items when scrolling to last item in start position', async () => {
      const virtualizer = await createVirtualizer({items: array(1000)});

      virtualizer.element(999)!.scrollIntoView({block: 'start'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '999')
      );

      const visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('996');
      expect(last(visible).textContent).to.equal('999');
    });

    it('shows the correct items when scrolling to center position', async () => {
      const virtualizer = await createVirtualizer({items: array(1000)});

      virtualizer.element(200)!.scrollIntoView({block: 'center'});

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
      const virtualizer = await createVirtualizer({items: array(1000)});
      virtualizer.element(0)!.scrollIntoView({block: 'end'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '0')
      );

      const visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('0');
      expect(last(visible).textContent).to.equal('3');
    });

    it('shows the correct items when scrolling to nearest position', async () => {
      const virtualizer = await createVirtualizer({items: array(1000)});

      // The nearest position for item 500 will be at the end.
      virtualizer.element(500)!.scrollIntoView({block: 'nearest'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '500')
      );

      let visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('497');
      expect(last(visible).textContent).to.equal('500');

      // The nearest position for item 3 will be at the start.
      virtualizer.element(300)!.scrollIntoView({block: 'nearest'});

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '300')
      );

      visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('300');
      expect(last(visible).textContent).to.equal('303');

      // No change in visible items is expected since item 5 is already visible.
      virtualizer.element(302)!.scrollIntoView({block: 'nearest'});

      // Need to wait a frame before testing to ensure that we don't
      // scroll, since all of the assertions below were already
      // true before our last call to `scrollIntoView()`
      await new Promise(requestAnimationFrame);

      visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('300');
      expect(last(visible).textContent).to.equal('303');
    });
  });

  describe('scrollToIndex', () => {
    it('shows the correct items when scrolling to start position', async () => {
      const virtualizer = await createVirtualizer({items: array(1000)});

      virtualizer.scrollToIndex(5, 'start');

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '5')
      );

      const visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('5');
      expect(last(visible).textContent).to.equal('8');
    });

    it('shows leading items when scrolling to last item in start position', async () => {
      const virtualizer = await createVirtualizer({items: array(1000)});

      virtualizer.scrollToIndex(999, 'start');

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '999')
      );

      const visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('996');
      expect(last(visible).textContent).to.equal('999');
    });

    it('shows the correct items when scrolling to center position', async () => {
      const virtualizer = await createVirtualizer({items: array(1000)});

      virtualizer.scrollToIndex(200, 'center');

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
      const virtualizer = await createVirtualizer({items: array(1000)});
      virtualizer.scrollToIndex(0, 'end');

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '0')
      );

      const visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('0');
      expect(last(visible).textContent).to.equal('3');
    });

    it('shows the correct items when scrolling to nearest position', async () => {
      const virtualizer = await createVirtualizer({items: array(1000)});

      // The nearest position for item 500 will be at the end.
      virtualizer.scrollToIndex(500, 'nearest');

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '500')
      );

      let visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('497');
      expect(last(visible).textContent).to.equal('500');

      // The nearest position for item 3 will be at the start.
      virtualizer.scrollToIndex(300, 'nearest');

      await until(() =>
        getVisibleItems(virtualizer).find((e) => e.textContent === '300')
      );

      visible = getVisibleItems(virtualizer);
      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('300');
      expect(last(visible).textContent).to.equal('303');

      // No change in visible items is expected since item 5 is already visible.
      virtualizer.scrollToIndex(302, 'nearest');

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
