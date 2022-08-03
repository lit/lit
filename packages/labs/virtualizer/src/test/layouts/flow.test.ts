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
import {flow} from '../../layouts/flow.js';
import {expect, html, fixture} from '@open-wc/testing';

describe('flow layout', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  let items: unknown[] = [];
  let litVirtualizer: LitVirtualizer;

  function getRendered() {
    return Array.from(litVirtualizer.renderRoot.querySelectorAll('.item'));
  }

  function getVisible() {
    return getRendered().filter((e) => isInViewport(e, litVirtualizer));
  }

  beforeEach(async () => {
    items = Array.from(Array(10).keys());

    const renderItem = (item: unknown) => html`<div class="item">${item}</div>`;
    const example: HTMLDivElement = await fixture(html` <div>
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

    // Wait for the rendering of at least one item to complete.
    await until(() => getRendered().length > 0);
  });

  afterEach(() => {
    items = [];
    litVirtualizer = undefined as unknown as LitVirtualizer;
  });

  describe('scrollToIndex', () => {
    let rendered: Element[] = [];
    let visible: Element[] = [];

    beforeEach(async () => {
      await until(() => (rendered = getRendered()).length === items.length);

      // All items have been rendered.
      expect(rendered.length).to.equal(items.length);

      await until(() => (visible = getVisible()).length == 4);

      expect(first(visible).textContent).to.equal('0');
      expect(last(visible).textContent).to.equal('3');
    });

    it('shows the correct items when scrolling to start position', async () => {
      litVirtualizer.scrollToIndex(5, 'start');

      await until(() => (visible = getVisible()).includes(rendered[5]));

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('5');
      expect(last(visible).textContent).to.equal('8');
    });

    it('shows leading items when scrolling to last item in start position', async () => {
      litVirtualizer.scrollToIndex(9, 'start');

      await until(() => (visible = getVisible()).includes(rendered[9]));

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('6');
      expect(last(visible).textContent).to.equal('9');
    });

    it('shows the correct items when scrolling to center position', async () => {
      litVirtualizer.scrollToIndex(5, 'center');

      await until(() => (visible = getVisible()).includes(rendered[5]));

      // 5 items are visible, but the first and last items are only half-visible.
      expect(visible.length).to.equal(5);
      expect(first(visible).textContent).to.equal('3');
      expect(last(visible).textContent).to.equal('7');
    });

    it('shows trailing items when scrolling to first item in end position', async () => {
      litVirtualizer.scrollToIndex(0, 'end');

      await until(() => (visible = getVisible()).includes(rendered[0]));

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('0');
      expect(last(visible).textContent).to.equal('3');
    });

    it('shows the correct items when scrolling to nearest position', async () => {
      // The nearest position for item 7 will be at the end.
      litVirtualizer.scrollToIndex(7, 'nearest');

      await until(() => (visible = getVisible()).includes(rendered[7]));

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('4');
      expect(last(visible).textContent).to.equal('7');

      // The nearest position for item 3 will be at the start.
      litVirtualizer.scrollToIndex(3, 'nearest');

      await until(() => (visible = getVisible()).includes(rendered[3]));

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('3');
      expect(last(visible).textContent).to.equal('6');

      // No change in visible items is expected since item 5 is already visible.
      litVirtualizer.scrollToIndex(5, 'nearest');

      await until(() => (visible = getVisible()).includes(rendered[5]));

      expect(visible.length).to.equal(4);
      expect(first(visible).textContent).to.equal('3');
      expect(last(visible).textContent).to.equal('6');
    });
  });
});
