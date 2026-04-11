/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect, html} from '@open-wc/testing';
import {ignoreBenignErrors, last} from '../helpers.js';
import {
  virtualizerFixture,
  DefaultItem,
} from '../virtualizer-test-utilities.js';

describe('keyFunction', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  describe('<lit-virtualizer>', () => {
    it('maintains item-element correspondence with no user-provided keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture();
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
    it('maintains item-element correspondence with an item-based keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture({
        keyFunction: (item: DefaultItem, _idx) => item.index,
      });
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
    it('maintains item-element correspondence with an index-based keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture({
        keyFunction: (_item, idx) => idx,
      });
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
  });

  describe('virtualize() directive', () => {
    it('maintains item-element correspondence with no user-provided keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture({
        useDirective: true,
      });
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
    it('maintains item-element correspondence with an item-based keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture({
        useDirective: true,
        keyFunction: (item: DefaultItem, _idx) => item.index,
      });
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
    it('maintains item-element correspondence with an index-based keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture({
        useDirective: true,
        keyFunction: (_item, idx) => idx,
      });
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
  });

  describe('non-unique scalar items with default keyFunction', () => {
    // Regression test for https://github.com/lit/lit/issues/5296
    // When items contain repeated scalar values, the previous default
    // keyFunction `(item) => item` produced duplicate keys for lit-html's
    // `repeat` directive, which caused malformed DOM during slice changes
    // on scroll: wrong items at wrong positions, off-by-one child counts,
    // and eventually a runtime `TypeError: Cannot read properties of null
    // (reading 'nextSibling')` thrown from `ChildPart._$clear`.
    const makeNonUniqueItems = (n: number) =>
      Array.from({length: n}, (_, i) => {
        const index = i + 1;
        if (index % 5 === 1) return `field_a value ${index}`;
        if (index % 5 === 2) return `sub_field ${index * 10}`;
        if (index % 5 === 3) return `another_field`;
        if (index % 5 === 4) return `nested_value true`;
        return ``;
      });

    it('renders correctly and stays consistent across multiple scroll jumps', async () => {
      const items = makeNonUniqueItems(1000);
      const {inspector, scroller, virtualizer} =
        await virtualizerFixture<string>({
          items,
          renderItem: (item) => html`<div class="item">${item}</div>`,
          scroller: false,
        });
      await virtualizer.layoutComplete;

      // Initial render must produce at least one child. Without the fix,
      // the lit.dev playground repro shows zero children on initial load.
      expect(inspector.childElements.length).to.be.greaterThan(0);
      expect(inspector.range).to.not.equal(undefined);

      // Scramble-scroll across many positions, yielding a short wait
      // between jumps so the scroll handler and subsequent render cycles
      // interleave. The bug surfaces as DOM mutations pile up against
      // `repeat`'s keyed reconciliation with duplicate keys.
      const positions = [
        500, 2000, 5000, 1000, 8000, 3000, 10000, 4000, 7000, 2500, 9000, 6000,
        1500, 8500, 3500, 500, 7500, 2500, 9500, 3500, 6500, 1500, 8500, 4500,
      ];
      for (const top of positions) {
        (scroller as Window | Element).scrollTo!({top} as ScrollToOptions);
        await new Promise((r) => setTimeout(r, 5));
      }
      await virtualizer.layoutComplete;

      // DOM child count must match the virtualizer's current range.
      const range = inspector.range!;
      const expectedCount = range.last - range.first + 1;
      const kids = inspector.childElements;
      expect(kids.length).to.equal(expectedCount);

      // Each rendered child must display the correct item for its index.
      // (The `field_a value N` and `sub_field N` variants encode the
      // index, so positional shifts produced by the bug are detectable
      // even though `another_field`, `nested_value true`, and `''` repeat.)
      for (let i = 0; i < kids.length; i++) {
        expect(kids[i].textContent).to.equal(items[range.first + i]);
      }
    });
  });
});
