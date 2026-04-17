/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect, html} from '@open-wc/testing';
import {LitElement} from 'lit';
import {ignoreBenignErrors} from '../helpers.js';
import {
  virtualizerFixture,
  DefaultItem,
} from '../virtualizer-test-utilities.js';

/**
 * A row component that counts how many times its `data` property setter
 * is invoked. Used by the slot-stability tests to assert that a typical
 * scroll step only re-renders one row, not N.
 */
class CountingRow extends LitElement {
  static properties = {data: {type: Object, attribute: false}};
  static instanceCount = 0;
  static dataSetCount = 0;
  private _data: {index: number; text: string} | null = null;
  constructor() {
    super();
    CountingRow.instanceCount++;
  }
  get data() {
    return this._data;
  }
  set data(v: {index: number; text: string} | null) {
    CountingRow.dataSetCount++;
    const old = this._data;
    this._data = v;
    this.requestUpdate('data', old);
  }
  createRenderRoot() {
    return this;
  }
  render() {
    return html`<div class="item" style="height: 50px; width: 50px">
      ${this._data?.text ?? ''}
    </div>`;
  }
}
customElements.define('counting-row', CountingRow);

/** Reset the static counters between tests. */
function resetCountingRow() {
  CountingRow.instanceCount = 0;
  CountingRow.dataSetCount = 0;
}

describe('recycled mode', () => {
  ignoreBenignErrors(beforeEach, afterEach);
  beforeEach(() => resetCountingRow());

  describe('<lit-virtualizer>', () => {
    it('opts in via recycle=true without breaking the initial render', async () => {
      const {inspector, virtualizer} = await virtualizerFixture({
        recycle: true,
      });
      await virtualizer.layoutComplete;
      const kids = inspector.childElements;
      expect(kids.length).to.be.greaterThan(0);
      // Each rendered child must show the right item text — this catches
      // any slot-to-item miswiring in the adapter path.
      const range = inspector.range!;
      for (const el of kids) {
        const txt = el.textContent!.trim();
        const m = /Item (\d+)/.exec(txt);
        expect(m, `rendered child has unexpected text "${txt}"`).to.not.be.null;
        const idx = Number(m![1]);
        expect(idx).to.be.gte(range.first);
        expect(idx).to.be.lte(range.last);
      }
    });

    it('reuses row elements across scrolls once the pool reaches steady state', async () => {
      const {host, virtualizer, inspector} =
        await virtualizerFixture<DefaultItem>({
          recycle: true,
          renderItem: (item) =>
            html`<counting-row
              .data=${item as unknown as {index: number; text: string}}
            ></counting-row>`,
        });
      await virtualizer.layoutComplete;

      // First scroll: the pool may grow from its initial shape to the
      // full overscan-expanded size, which involves creating fresh row
      // instances for the added slots. Count this transition but don't
      // assert on it — it's a one-time cost, not per-scroll work.
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      const createdAfterFirstScroll = CountingRow.instanceCount;
      expect(createdAfterFirstScroll).to.be.greaterThan(0);

      // Second scroll of the same distance: the pool is now at its
      // steady-state size, so no further growth is needed. All items
      // scrolling through should land on existing recycled containers,
      // which means `render()` commits new templates into existing
      // `<counting-row>` elements — not fresh instances.
      host.scrollTo({top: 4000});
      await virtualizer.layoutComplete;
      const delta = CountingRow.instanceCount - createdAfterFirstScroll;
      expect(
        delta,
        `created ${delta} new <counting-row>s on a steady-state scroll — expected recycling to reuse existing elements`
      ).to.be.lessThanOrEqual(2);
      // Sanity check that the visible range actually moved.
      const range = inspector.range!;
      expect(range.first).to.be.greaterThan(0);
    });

    it('triggers O(1) row data updates per small scroll step', async () => {
      const {host, virtualizer} = await virtualizerFixture<DefaultItem>({
        recycle: true,
        renderItem: (item) =>
          html`<counting-row
            .data=${item as unknown as {index: number; text: string}}
          ></counting-row>`,
      });
      await virtualizer.layoutComplete;
      // Let the pool stabilize at a non-trivial size by doing one large
      // scroll so the range has grown beyond its initial shape. Then
      // capture the data-set counter and do a small scroll.
      host.scrollTo({top: 1000});
      await virtualizer.layoutComplete;
      const setCountBefore = CountingRow.dataSetCount;

      // Scroll by one row height. In an ideal recycled path, only the
      // slot whose item cycles at the buffer edge gets a new data
      // commit; everyone else keeps their existing binding.
      host.scrollTo({top: 1050});
      await virtualizer.layoutComplete;
      const setCountAfter = CountingRow.dataSetCount;
      const delta = setCountAfter - setCountBefore;

      // One-item scrolls may trigger 0 data setter calls (no range
      // change) or 1 (exactly one slot cycled). They must not trigger
      // N setter calls, which is what the previous rendering path
      // would do on every range shift.
      expect(
        delta,
        `small scroll caused ${delta} data-setter calls — expected ≤ 2`
      ).to.be.lessThanOrEqual(2);
    });

    it('renders correct items at correct positions after a large scroll jump', async () => {
      const {host, inspector, virtualizer} = await virtualizerFixture({
        recycle: true,
      });
      await virtualizer.layoutComplete;

      host.scrollTo({top: 5000});
      await virtualizer.layoutComplete;

      const range = inspector.range!;
      // Every rendered child must show the correct item text. This is
      // the critical integrity check: the adapter's getChildForIndex
      // / getIndexForChild must agree with the layout's range.
      for (const el of inspector.childElements) {
        const txt = el.textContent!.trim();
        const m = /Item (\d+)/.exec(txt);
        expect(m, `child has unexpected text "${txt}"`).to.not.be.null;
        const idx = Number(m![1]);
        expect(idx).to.be.gte(range.first);
        expect(idx).to.be.lte(range.last);
      }
    });

    it('stays correct across a sequence of scroll jumps', async () => {
      const {host, inspector, virtualizer} = await virtualizerFixture({
        recycle: true,
      });
      await virtualizer.layoutComplete;

      const positions = [500, 2000, 5000, 1000, 8000, 3000, 10000, 4000, 0];
      for (const top of positions) {
        host.scrollTo({top});
        await virtualizer.layoutComplete;
      }

      // After the final scroll to top=0, the range should include item 0
      // again and every rendered child should show the right text.
      const range = inspector.range!;
      expect(range.first).to.equal(0);
      for (const el of inspector.childElements) {
        const txt = el.textContent!.trim();
        const m = /Item (\d+)/.exec(txt);
        expect(m).to.not.be.null;
        const idx = Number(m![1]);
        expect(idx).to.be.gte(range.first);
        expect(idx).to.be.lte(range.last);
      }
    });

    it('handles item-data updates by re-committing reused slots', async () => {
      // Items initialized with one text string, then replaced with a
      // different string. Recycled pool should reflect the new items.
      const initialItems = Array.from({length: 200}, (_, i) => ({
        index: i,
        text: `A${i}`,
      }));
      const {inspector, virtualizer} = await virtualizerFixture<DefaultItem>({
        recycle: true,
        items: initialItems,
        renderItem: (item) =>
          html`<div class="item" style="height: 50px; width: 50px">
            ${item.text}
          </div>`,
      });
      await virtualizer.layoutComplete;
      // Before replacement: every rendered child must show an "A…"
      // string for its corresponding item. We can't assume
      // childElements[0] corresponds to item 0 in recycled mode —
      // DOM order follows pool insertion, not item index — so
      // check that every child's text matches the "A" prefix.
      for (const el of inspector.childElements) {
        expect(el.textContent!.trim()).to.match(/^A\d+$/);
      }

      // Replace the items array with new data. The pool stays put, but
      // each slot's template should re-commit with the new strings.
      const updatedItems = initialItems.map((i) => ({
        index: i.index,
        text: `B${i.index}`,
      }));
      (virtualizer as {items: DefaultItem[]}).items = updatedItems;
      await virtualizer.layoutComplete;
      // After replacement: every rendered child must show a "B…" string.
      for (const el of inspector.childElements) {
        expect(el.textContent!.trim()).to.match(/^B\d+$/);
      }
    });
  });

  describe('virtualize() directive', () => {
    it('renders correctly when used via the directive', async () => {
      const {inspector, virtualizer} = await virtualizerFixture({
        useDirective: true,
        recycle: true,
      });
      await virtualizer.layoutComplete;
      expect(inspector.childElements.length).to.be.greaterThan(0);
      const range = inspector.range!;
      for (const el of inspector.childElements) {
        const m = /Item (\d+)/.exec(el.textContent!);
        expect(m).to.not.be.null;
        const idx = Number(m![1]);
        expect(idx).to.be.gte(range.first);
        expect(idx).to.be.lte(range.last);
      }
    });

    it('stays correct across scroll jumps when used via the directive', async () => {
      const {host, inspector, virtualizer} = await virtualizerFixture({
        useDirective: true,
        recycle: true,
      });
      await virtualizer.layoutComplete;
      const positions = [500, 2000, 5000, 1000, 8000, 3000];
      for (const top of positions) {
        host.scrollTo({top});
        await virtualizer.layoutComplete;
      }
      const range = inspector.range!;
      for (const el of inspector.childElements) {
        const m = /Item (\d+)/.exec(el.textContent!);
        expect(m).to.not.be.null;
        const idx = Number(m![1]);
        expect(idx).to.be.gte(range.first);
        expect(idx).to.be.lte(range.last);
      }
    });
  });
});
