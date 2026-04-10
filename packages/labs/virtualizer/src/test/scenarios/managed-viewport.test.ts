/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {array, ignoreBenignErrors, pass} from '../helpers.js';
import {Virtualizer} from '../../Virtualizer.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import '../../lit-virtualizer.js';
import {RangeChangedEvent} from '../../events.js';
import {expect, fixture, html} from '@open-wc/testing';

/**
 * Tests for `scroller: 'managed'` mode, where the virtualizer does not
 * observe the DOM for scroll position or viewport size and an external
 * controller drives it via the `viewport` property.
 *
 * These tests instantiate `Virtualizer` directly (rather than going
 * through `<lit-virtualizer>` or the `virtualize` directive) so that
 * managed-mode behavior can be exercised before the wire-through to
 * those higher-level APIs is added in a later step.
 */
describe('managed viewport mode', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  /**
   * Create a host element and instantiate a Virtualizer in managed
   * mode. Returns the host element, the virtualizer instance, and a
   * helper for collecting `rangeChanged` events.
   */
  async function createManagedVirtualizer(opts: {
    items: number[];
    viewport: {
      scrollTop: number;
      scrollLeft: number;
      width: number;
      height: number;
    };
  }) {
    const host = (await fixture(
      html`<div style="display: block; position: relative;"></div>`
    )) as HTMLElement;

    const events: RangeChangedEvent[] = [];
    host.addEventListener('rangeChanged', (e) =>
      events.push(e as RangeChangedEvent)
    );

    const virtualizer = new Virtualizer({
      hostElement: host,
      scroller: 'managed',
      viewport: opts.viewport,
    });
    virtualizer.items = opts.items;
    virtualizer.connected();

    return {host, virtualizer, events};
  }

  it('renders an initial range based on the provided viewport', async () => {
    const items = array(1000);
    const {events} = await createManagedVirtualizer({
      items,
      viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
    });

    // The default flow layout uses estimated item sizes (100x100 by
    // default) until measurements arrive, so the initial range should
    // include several items starting from index 0.
    await pass(() => expect(events.length).to.be.greaterThan(0));

    const firstEvent = events[0];
    expect(firstEvent.first).to.equal(0);
    // The exact `last` depends on layout overhang and estimates; we
    // just verify the range is non-trivial and starts at 0.
    expect(firstEvent.last).to.be.greaterThan(0);
  });

  it('updates the rendered range when viewport.scrollTop changes', async () => {
    const items = array(1000);
    const {virtualizer, events} = await createManagedVirtualizer({
      items,
      viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
    });

    await pass(() => expect(events.length).to.be.greaterThan(0));
    const initialFirst = events[events.length - 1].first;

    // Scroll way down. With ~100px estimated item height, scrolling to
    // 5000 should put us in the neighborhood of item 50.
    virtualizer.viewport = {
      scrollTop: 5000,
      scrollLeft: 0,
      width: 200,
      height: 200,
    };

    await pass(() => {
      const latest = events[events.length - 1];
      // Range should have advanced significantly past the initial range.
      expect(latest.first).to.be.greaterThan(initialFirst + 10);
    });
  });

  it('updates the rendered range when viewport.height changes', async () => {
    const items = array(1000);
    const {virtualizer, events} = await createManagedVirtualizer({
      items,
      viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
    });

    await pass(() => expect(events.length).to.be.greaterThan(0));
    const initialLast = events[events.length - 1].last;

    // Quadruple the viewport height — the range should grow.
    virtualizer.viewport = {
      scrollTop: 0,
      scrollLeft: 0,
      width: 200,
      height: 800,
    };

    await pass(() => {
      const latest = events[events.length - 1];
      expect(latest.last).to.be.greaterThan(initialLast);
    });
  });

  it('does not attach scroll listeners to the host element', async () => {
    const items = array(100);
    const {host, events} = await createManagedVirtualizer({
      items,
      viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
    });

    await pass(() => expect(events.length).to.be.greaterThan(0));
    const initialEventCount = events.length;

    // Dispatching a scroll event on the host should NOT cause the
    // virtualizer to schedule an update (no listener is attached in
    // managed mode).
    host.dispatchEvent(new Event('scroll'));

    // Wait briefly to ensure no async update is scheduled.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(events.length).to.equal(initialEventCount);
  });

  it('exposes the viewport via the property getter', async () => {
    const viewport = {scrollTop: 100, scrollLeft: 50, width: 300, height: 400};
    const {virtualizer} = await createManagedVirtualizer({
      items: array(10),
      viewport,
    });

    expect(virtualizer.viewport).to.deep.equal(viewport);

    const newViewport = {scrollTop: 0, scrollLeft: 0, width: 200, height: 200};
    virtualizer.viewport = newViewport;
    expect(virtualizer.viewport).to.deep.equal(newViewport);
  });

  describe('via <lit-virtualizer>', () => {
    it('renders in managed mode and updates when viewport changes', async () => {
      const items = array(1000);
      const initialViewport = {
        scrollTop: 0,
        scrollLeft: 0,
        width: 200,
        height: 200,
      };

      const lvs = (await fixture(
        html`<lit-virtualizer
          .scroller=${'managed'}
          .viewport=${initialViewport}
          .items=${items}
          .renderItem=${(i: number) =>
            html`<div style="block-size: 50px;">${i}</div>`}
        ></lit-virtualizer>`
      )) as LitVirtualizer;

      // Initial render: items starting from 0 should be visible.
      await pass(() =>
        expect(lvs.querySelector('div')?.textContent).to.equal('0')
      );

      // Scroll the managed viewport down. Setting the property should
      // schedule a layout update; new items should appear.
      lvs.viewport = {
        scrollTop: 5000,
        scrollLeft: 0,
        width: 200,
        height: 200,
      };

      await pass(() => {
        const firstRendered = lvs.querySelector('div');
        const idx = firstRendered ? parseInt(firstRendered.textContent!) : -1;
        // ~100px estimated item size means scrollTop=5000 should put
        // us in the neighborhood of item 50. Allow plenty of slack.
        expect(idx).to.be.greaterThan(20);
      });
    });
  });
});
