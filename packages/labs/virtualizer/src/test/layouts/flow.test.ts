/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  first,
  last,
  ignoreBenignErrors,
  isInViewport,
  until,
} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {VisibilityChangedEvent} from '../../Virtualizer.js';
import {flow} from '../../layouts/flow.js';
import {expect, html, fixture} from '@open-wc/testing';

describe('flow layout', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  let items: unknown[] = [];
  let visible: HTMLElement[] = [];
  let example: HTMLDivElement = undefined as unknown as HTMLDivElement;
  let litVirtualizer: LitVirtualizer;

  function getRendered() {
    return Array.from(
      litVirtualizer.renderRoot.querySelectorAll('.item')
    ) as HTMLElement[];
  }

  function getVisible() {
    return getRendered().filter((e) => isInViewport(e, litVirtualizer));
  }

  beforeEach(async () => {
    items = Array.from(Array(1000).keys());

    const renderItem = (item: unknown) => html`<div class="item">${item}</div>`;
    example = await fixture(html` <div>
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
        .layout=${flow()}
        .items=${items}
        .renderItem=${renderItem}
      ></lit-virtualizer>
    </div>`);
    litVirtualizer = example.querySelector('lit-virtualizer')!;
    expect(litVirtualizer).to.be.instanceOf(LitVirtualizer);

    await until(() => (visible = getVisible()).length == 4);

    expect(first(visible).textContent).to.equal('0');
    expect(last(visible).textContent).to.equal('3');
  });

  afterEach(() => {
    items = [];
    visible = [];
    litVirtualizer = undefined as unknown as LitVirtualizer;
    example = undefined as unknown as HTMLDivElement;
  });

  describe('item resizing', () => {
    it('emits VisibilityChanged event due to item resizing', async () => {
      await until(() => (visible = getVisible()).length == 4);

      const visibilityChangedEvents: VisibilityChangedEvent[] = [];
      example.addEventListener('visibilityChanged', (e) => {
        visibilityChangedEvents.push(e);
      });

      first(visible).style.height = '100px';

      await until(() => (visible = getVisible()).length == 3);
      await until(() => visibilityChangedEvents.length === 1);

      expect(last(visibilityChangedEvents).first).to.equal(0);
      expect(last(visibilityChangedEvents).last).to.equal(2);
      expect(last(visible).textContent).to.equal('2');

      first(visible).style.height = '10px';

      await until(() => (visible = getVisible()).length == 5);
      await until(() => visibilityChangedEvents.length === 2);

      expect(last(visibilityChangedEvents).first).to.equal(0);
      expect(last(visibilityChangedEvents).last).to.equal(4);
      expect(last(visible).textContent).to.equal('4');
    });
  });

  describe('scrollToIndex', () => {
    it('shows the correct items when scrolling to start position', async () => {
      litVirtualizer.scrollToIndex(5, 'start');

      await until(
        () => !!(visible = getVisible()).find((e) => e.textContent === '5')
      );

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('5');
      expect(last(visible).textContent).to.equal('8');
    });

    it('shows leading items when scrolling to last item in start position', async () => {
      litVirtualizer.scrollToIndex(999, 'start');

      await until(
        () => !!(visible = getVisible()).find((e) => e.textContent === '999')
      );

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('996');
      expect(last(visible).textContent).to.equal('999');
    });

    it('shows the correct items when scrolling to center position', async () => {
      litVirtualizer.scrollToIndex(200, 'center');

      await until(
        () => !!(visible = getVisible()).find((e) => e.textContent === '200')
      );

      // 5 items are visible, but the first and last items are only half-visible.
      expect(visible.length).to.equal(5);
      expect(first(visible).textContent).to.equal('198');
      expect(last(visible).textContent).to.equal('202');
    });

    it('shows trailing items when scrolling to first item in end position', async () => {
      litVirtualizer.scrollToIndex(0, 'end');

      await until(
        () => !!(visible = getVisible()).find((e) => e.textContent === '0')
      );

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('0');
      expect(last(visible).textContent).to.equal('3');
    });

    it('shows the correct items when scrolling to nearest position', async () => {
      // The nearest position for item 500 will be at the end.
      litVirtualizer.scrollToIndex(500, 'nearest');

      await until(
        () => !!(visible = getVisible()).find((e) => e.textContent === '500')
      );

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('497');
      expect(last(visible).textContent).to.equal('500');

      // The nearest position for item 3 will be at the start.
      litVirtualizer.scrollToIndex(300, 'nearest');

      await until(
        () => !!(visible = getVisible()).find((e) => e.textContent === '300')
      );

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('300');
      expect(last(visible).textContent).to.equal('303');

      // No change in visible items is expected since item 5 is already visible.
      litVirtualizer.scrollToIndex(302, 'nearest');

      await until(
        () => !!(visible = getVisible()).find((e) => e.textContent === '302')
      );

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('300');
      expect(last(visible).textContent).to.equal('303');
    });
  });
});
