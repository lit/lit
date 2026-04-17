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
    const container = await fixture(
      html` <div>
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
      </div>`
    );
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

      // Item 5 may already be rendered (within the initial overscan range),
      // so it becomes visible before items 6-8 are rendered. Use pass() to
      // retry until the post-scroll reflow completes and all 4 items appear.
      await pass(() => {
        const visible = getVisibleItems(virtualizer);
        expect(visible.length).to.equal(4);
        expect(first(visible).textContent).to.equal('5');
        expect(last(visible).textContent).to.equal('8');
      });
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

  describe('scroll size after items change', () => {
    it('corrects scroll size when replacing items with a small set', async () => {
      // Phase 1: create items whose rendered height depends on the item
      // value. Items 0–199 render at 200px. Items 200+ render at 50px.
      // This seeds the metrics cache with 200px entries.
      // Phase 2: replace with 5 items (values 200–204) at 50px. All 5
      // should be rendered, exercising _refineScrollSize()'s exact
      // calculation path. Without the fix, stale 200px cache entries
      // pollute the average and the scroll size is much too large.
      const TALL = 200;
      const SHORT = 50;
      const renderItem = (item: number) =>
        html`<div
          style="height: ${item < 200 ? TALL : SHORT}px; margin: 0; padding: 0;"
        >
          ${item}
        </div>`;
      const container = await fixture(html`
        <div>
          <style>
            lit-virtualizer {
              height: 200px;
              width: 200px;
              margin: 0;
              padding: 0;
            }
          </style>
          <lit-virtualizer
            scroller
            .items=${array(200)}
            .renderItem=${renderItem}
          ></lit-virtualizer>
        </div>
      `);
      const virtualizer = (await until(() =>
        container.querySelector('lit-virtualizer')
      )) as LitVirtualizer;
      await virtualizer.layoutComplete;

      // Scroll partway to populate the metrics cache with 200px entries.
      virtualizer.scrollToIndex(100, 'start');
      await virtualizer.layoutComplete;

      // Replace with 5 short items (values 200–204 → 50px each).
      virtualizer.items = [200, 201, 202, 203, 204];
      await virtualizer.layoutComplete;

      // 5 items * 50px = 250px. Allow some tolerance for margins.
      // Without the fix, the stale 200px cache entries inflate this
      // well past 500px.
      await pass(() => expect(virtualizer.scrollHeight).to.be.lessThan(400));
    });
  });

  describe('scrollIntoView with offset within scroller', () => {
    it('lands on the correct item in non-scroller mode', async () => {
      // Custom fixture: parent scroller with spacer above virtualizer.
      // This reproduces the bug where offsetWithinScroller was computed
      // from raw getBoundingClientRect() differences, causing overshoot.
      const container = await fixture(html`
        <div>
          <style>
            .scroller {
              height: 200px;
              overflow: auto;
            }
            .spacer {
              height: 50px;
            }
            .item {
              height: 50px;
              margin: 0;
              padding: 0;
            }
          </style>
          <div class="scroller">
            <div class="spacer"></div>
            <lit-virtualizer
              .items=${array(1000)}
              .renderItem=${(item: number) =>
                html`<div class="item">${item}</div>`}
            ></lit-virtualizer>
          </div>
        </div>
      `);
      const virtualizer = (await until(() =>
        container.querySelector('lit-virtualizer')
      )) as LitVirtualizer;
      const scroller = container.querySelector('.scroller') as HTMLElement;
      await virtualizer.layoutComplete;

      virtualizer.element(500)!.scrollIntoView({block: 'start'});
      await until(() => {
        const items = Array.from(
          virtualizer.renderRoot.querySelectorAll('.item')
        ) as HTMLElement[];
        return items.find((e) => e.textContent?.trim() === '500');
      });

      // Check that item 500 is at the top of the scroller viewport.
      const scrollerRect = scroller.getBoundingClientRect();
      const items = Array.from(
        virtualizer.renderRoot.querySelectorAll('.item')
      ).filter((e) => isInViewport(e, scroller)) as HTMLElement[];
      expect(first(items).textContent?.trim()).to.equal('500');
      // The item's top should be close to the scroller's top.
      const itemRect = first(items).getBoundingClientRect();
      expect(Math.abs(itemRect.top - scrollerRect.top)).to.be.lessThan(5);
    });

    it('renders items after scrollIntoView to a far index', async () => {
      // Regression test for https://github.com/lit/lit/issues/4767
      // With a large item count, the offsetWithinScroller bug caused
      // cumulative position-estimation errors to snowball across reflow
      // iterations, eventually clamping scrollTop to the bottom of the
      // scroll range and leaving the virtualizer with zero items rendered.
      const container = await fixture(html`
        <div>
          <style>
            .scroller {
              height: 200px;
              overflow: auto;
            }
            .spacer {
              height: 50px;
            }
            .item {
              height: 50px;
              margin: 0;
              padding: 0;
            }
          </style>
          <div class="scroller">
            <div class="spacer"></div>
            <lit-virtualizer
              .items=${array(10000)}
              .renderItem=${(item: number) =>
                html`<div class="item">${item}</div>`}
            ></lit-virtualizer>
          </div>
        </div>
      `);
      const virtualizer = (await until(() =>
        container.querySelector('lit-virtualizer')
      )) as LitVirtualizer;
      const scroller = container.querySelector('.scroller') as HTMLElement;
      await virtualizer.layoutComplete;

      virtualizer.element(8000)!.scrollIntoView({block: 'start'});
      await until(() => {
        const items = Array.from(
          virtualizer.renderRoot.querySelectorAll('.item')
        ) as HTMLElement[];
        return items.find((e) => e.textContent?.trim() === '8000');
      });

      // The list must not be blank and item 8000 must be in the viewport.
      const items = Array.from(
        virtualizer.renderRoot.querySelectorAll('.item')
      ).filter((e) => isInViewport(e, scroller)) as HTMLElement[];
      expect(items.length).to.be.greaterThan(0);
      expect(first(items).textContent?.trim()).to.equal('8000');
    });
  });

  describe('item reorder layout correctness', () => {
    it('updates positions after reordering items with different heights', async () => {
      // Regression test for https://github.com/lit/lit/issues/4670
      // When items are reordered using a keyFunction, Lit's repeat directive
      // moves DOM elements rather than re-rendering them. Since no individual
      // element changes size, the ResizeObserver doesn't fire, and without
      // a MutationObserver-based re-measure the layout uses stale cached
      // sizes at the old index positions, causing overlaps or gaps.
      interface SizedItem {
        id: string;
        height: number;
      }
      const items: SizedItem[] = [
        {id: 'a', height: 20},
        {id: 'b', height: 40},
        {id: 'c', height: 80},
      ];
      const renderItem = (item: SizedItem) =>
        html`<div
          class="sized-item"
          style="height: ${item.height}px; margin: 0; padding: 0;"
        >
          ${item.id}
        </div>`;

      const container = await fixture(html`
        <div>
          <style>
            lit-virtualizer {
              height: 200px;
              width: 200px;
              margin: 0;
              padding: 0;
            }
          </style>
          <lit-virtualizer
            scroller
            .items=${items}
            .renderItem=${renderItem}
            .keyFunction=${(item: SizedItem) => item.id}
          ></lit-virtualizer>
        </div>
      `);
      const virtualizer = (await until(() =>
        container.querySelector('lit-virtualizer')
      )) as LitVirtualizer;
      await virtualizer.layoutComplete;

      // Verify initial layout: items should be contiguous with no gaps.
      await pass(() => {
        const children = Array.from(
          virtualizer.renderRoot.querySelectorAll('.sized-item')
        );
        expect(children.length).to.equal(3);
      });

      // Swap items b and c.
      const swapped: SizedItem[] = [items[0], items[2], items[1]];
      virtualizer.items = swapped;

      // Wait for the MutationObserver to trigger re-measure and layout
      // to settle. The MutationObserver fires asynchronously after the
      // DOM mutation, so we need to wait for multiple layout cycles.
      await pass(() => {
        const children = Array.from(
          virtualizer.renderRoot.querySelectorAll('.sized-item')
        ) as HTMLElement[];
        expect(children.length).to.equal(3);
        // Verify order: a, c, b.
        expect(children[0].textContent?.trim()).to.equal('a');
        expect(children[1].textContent?.trim()).to.equal('c');
        expect(children[2].textContent?.trim()).to.equal('b');
        // Verify no overlaps: each child's top should be >= the previous
        // child's bottom.
        for (let i = 1; i < children.length; i++) {
          const prevBottom = children[i - 1].getBoundingClientRect().bottom;
          const curTop = children[i].getBoundingClientRect().top;
          expect(curTop).to.be.at.least(
            prevBottom - 1,
            `Item ${i} overlaps with item ${i - 1}`
          );
        }
      });
    });
  });

  describe('scrollToIndex', () => {
    it('shows the correct items when scrolling to start position', async () => {
      const virtualizer = await createVirtualizer({items: array(1000)});

      virtualizer.scrollToIndex(5, 'start');

      // Item 5 may already be rendered (within the initial overscan range),
      // so it becomes visible before items 6-8 are rendered. Use pass() to
      // retry until the post-scroll reflow completes and all 4 items appear.
      await pass(() => {
        const visible = getVisibleItems(virtualizer);
        expect(visible.length).to.equal(4);
        expect(first(visible).textContent).to.equal('5');
        expect(last(visible).textContent).to.equal('8');
      });
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

  describe('non-uniform margins', () => {
    // Regression test for off-by-one errors in margin handling.
    //
    // Items alternate between two margin types:
    //   Type A (even): margin-block-start: 5px, margin-block-end: 30px
    //   Type B (odd):  margin-block-start: 30px, margin-block-end: 5px
    //
    // This produces alternating collapsed margins:
    //   Between A→B (even→odd): collapse(30, 30) = 30px
    //   Between B→A (odd→even): collapse(5, 5) = 5px
    //
    // The test checks gaps between consecutive items rather than absolute
    // positions, avoiding sensitivity to initial layout timing.

    async function createNonUniformMarginVirtualizer() {
      const container = await fixture(
        html` <div>
          <style>
            lit-virtualizer {
              height: 200px;
              width: 200px;
              margin: 0;
              padding: 0;
            }
            .margin-item {
              width: 200px;
              height: 50px;
              padding: 0;
              margin: 0;
            }
            .margin-item.type-a {
              margin-block-start: 5px;
              margin-block-end: 30px;
            }
            .margin-item.type-b {
              margin-block-start: 30px;
              margin-block-end: 5px;
            }
          </style>
          <lit-virtualizer
            scroller
            .layout=${flow()}
            .items=${array(200)}
            .renderItem=${(item: number) =>
              html`<div
                class="margin-item ${item % 2 === 0 ? 'type-a' : 'type-b'}"
              >
                ${item}
              </div>`}
          ></lit-virtualizer>
        </div>`
      );
      const virtualizer = (await until(() =>
        container.querySelector('lit-virtualizer')
      )) as LitVirtualizer;
      expect(virtualizer).to.be.instanceOf(LitVirtualizer);
      return virtualizer;
    }

    function getItemVisualTop(el: HTMLElement): number {
      // The virtualizer positions items using transform: translate(x, y).
      // For absolutely positioned elements, the visual top also includes
      // the element's margin-block-start (which shifts absolute elements
      // from their containing block). The layout subtracts marginBlockStart
      // from the position before setting the transform, so we add it back.
      const match = el.style.transform.match(
        /translate\(\s*[\d.-]+px\s*,\s*([\d.-]+)px\s*\)/
      );
      const transformTop = match ? parseFloat(match[1]) : NaN;
      const mbs = parseFloat(getComputedStyle(el).marginBlockStart) || 0;
      return transformTop + mbs;
    }

    /**
     * Returns rendered items sorted by their index, as an array of
     * {index, top} objects.
     */
    function getSortedItemPositions(virtualizer: LitVirtualizer) {
      const items = Array.from(
        virtualizer.renderRoot.querySelectorAll('.margin-item')
      ) as HTMLElement[];
      return items
        .map((el) => ({
          index: parseInt(el.textContent!.trim()),
          top: getItemVisualTop(el),
        }))
        .sort((a, b) => a.index - b.index);
    }

    /**
     * Expected collapsed margin between items at index-1 and index:
     *   even→odd (A→B): collapse(30, 30) = 30
     *   odd→even (B→A): collapse(5, 5) = 5
     */
    function expectedGap(index: number): number {
      // Gap before item `index` = collapsed margin between (index-1) and index.
      // If index is odd: previous is even (A), gap = collapse(A.end=30, B.start=30) = 30
      // If index is even: previous is odd (B), gap = collapse(B.end=5, A.start=5) = 5
      return index % 2 === 1 ? 30 : 5;
    }

    it('gaps between items match expected collapsed margins', async () => {
      const virtualizer = await createNonUniformMarginVirtualizer();

      // Wait for layout to stabilize with measured margins
      await pass(() => {
        const positions = getSortedItemPositions(virtualizer);
        expect(positions.length).to.be.greaterThan(1);
      });
      await new Promise((r) => setTimeout(r, 500));

      const positions = getSortedItemPositions(virtualizer);
      expect(positions.length).to.be.greaterThan(2);

      // Check gaps between each pair of consecutive rendered items
      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1];
        const curr = positions[i];
        // Only check truly consecutive items
        if (curr.index !== prev.index + 1) continue;
        const actualGap = curr.top - prev.top - 50; // 50 = item height
        const expected = expectedGap(curr.index);
        expect(actualGap).to.be.closeTo(
          expected,
          1,
          `Gap before item ${curr.index}: expected ${expected}px, got ${actualGap}px`
        );
      }
    });

    it('gaps remain correct after scrolling forward', async () => {
      const virtualizer = await createNonUniformMarginVirtualizer();

      await pass(() => {
        expect(getSortedItemPositions(virtualizer).length).to.be.greaterThan(1);
      });

      // Scroll forward to trigger the forward layout loop with many items
      virtualizer.scrollToIndex(50, 'start');
      await until(() => {
        const positions = getSortedItemPositions(virtualizer);
        return positions.find((p) => p.index === 50);
      });
      await new Promise((r) => setTimeout(r, 500));

      const positions = getSortedItemPositions(virtualizer);

      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1];
        const curr = positions[i];
        if (curr.index !== prev.index + 1) continue;
        const actualGap = curr.top - prev.top - 50;
        const expected = expectedGap(curr.index);
        expect(actualGap).to.be.closeTo(
          expected,
          1,
          `Gap before item ${curr.index} after scroll: expected ${expected}px, got ${actualGap}px`
        );
      }
    });

    it('scrollToIndex scrolls to the border edge, not the margin edge', async () => {
      const virtualizer = await createNonUniformMarginVirtualizer();

      await pass(() => {
        expect(getSortedItemPositions(virtualizer).length).to.be.greaterThan(1);
      });

      // Scroll to an item far enough away to require estimation
      virtualizer.scrollToIndex(50, 'start');
      await until(() => {
        const positions = getSortedItemPositions(virtualizer);
        return positions.find((p) => p.index === 50);
      });
      await new Promise((r) => setTimeout(r, 500));

      // The scroll position should align with the item's visual (border)
      // edge, not its margin edge. For item 50 (even/type-a), the margin-
      // block-start is 5px. The scrollTop should equal the item's visual
      // top, which is its transform top + marginBlockStart.
      const positions = getSortedItemPositions(virtualizer);
      const item50 = positions.find((p) => p.index === 50);
      expect(item50).to.not.be.undefined;
      // The item's visual top should be at (or very near) the scrollTop
      expect(item50!.top).to.be.closeTo(
        virtualizer.scrollTop,
        2,
        `Item 50 visual top (${item50!.top}) should match scrollTop (${virtualizer.scrollTop})`
      );
    });
  });

  describe('display: contents ancestor with overflow: hidden', () => {
    it('renders children when slotted into a host whose slot has overflow: hidden', async () => {
      // Regression test for https://github.com/lit/lit/issues/4922
      // When a virtualizer is slotted into a shadow DOM host (e.g.
      // sl-split-panel), getParentElement follows assignedSlot, making
      // the <slot> element part of the ancestor chain. If that <slot>
      // has overflow: hidden (as sl-split-panel applies), Virtualizer
      // incorrectly treats it as a clipping ancestor. But <slot> elements
      // have display: contents by default, which generates no box, so
      // overflow is meaningless and should be ignored.

      // Create a custom element whose shadow DOM styles its slot with
      // overflow: hidden, mimicking sl-split-panel's behavior.
      const hostTag = 'slot-overflow-host-4922';
      if (!customElements.get(hostTag)) {
        customElements.define(
          hostTag,
          class extends HTMLElement {
            constructor() {
              super();
              const shadow = this.attachShadow({mode: 'open'});
              shadow.innerHTML =
                '<style>slot { overflow: hidden; }</style><slot></slot>';
            }
          }
        );
      }

      // Mimics the repro: lit-virtualizer (non-scroller mode) inside a
      // scrolling container, slotted into the host above. The ancestor
      // chain from the virtualizer traverses the <slot> with overflow:
      // hidden.
      const container = await fixture(html`
        <div>
          <style>
            .scroller {
              height: 200px;
              width: 200px;
              overflow: auto;
              margin: 0;
              padding: 0;
            }
            .item {
              height: 50px;
              width: 200px;
              margin: 0;
              padding: 0;
            }
          </style>
          <slot-overflow-host-4922>
            <div class="scroller">
              <lit-virtualizer
                .items=${array(100)}
                .renderItem=${(item: number) =>
                  html`<div class="item">${item}</div>`}
              ></lit-virtualizer>
            </div>
          </slot-overflow-host-4922>
        </div>
      `);
      const virtualizer = (await until(() =>
        container.querySelector('lit-virtualizer')
      )) as LitVirtualizer;
      await virtualizer.layoutComplete;

      // Without the fix, the viewport collapses because the <slot>'s
      // zero-size getBoundingClientRect() clips the viewport bounds,
      // causing no items to render.
      await pass(() => {
        const items = Array.from(
          virtualizer.renderRoot.querySelectorAll('.item')
        ) as HTMLElement[];
        expect(items.length).to.be.greaterThan(0);
      });
    });
  });
});
