/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {array, ignoreBenignErrors, pass} from '../helpers.js';
import {Virtualizer} from '../../Virtualizer.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import '../../lit-virtualizer.js';
import {
  DestinationChangedEvent,
  RangeChangedEvent,
  ScrollErrorEvent,
  ScrollIntoViewEndedEvent,
} from '../../events.js';
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

  describe('scrollIntoView', () => {
    /**
     * Helper: collects every event of the named type fired on the host.
     */
    function collect<E extends Event>(host: HTMLElement, type: string): E[] {
      const events: E[] = [];
      host.addEventListener(type, (e) => events.push(e as E));
      return events;
    }

    it('returns destination coordinates synchronously', async () => {
      const items = array(1000);
      const {virtualizer, events} = await createManagedVirtualizer({
        items,
        viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
      });
      // Wait for the initial layout cycle, then a second cycle (so the
      // source has propagated scrollSize back to the layout — the first
      // cycle computes virtualizerSize; the source picks it up on the
      // cycle after). Pushing a viewport that changes the rendered
      // range gives us an observable signal for the second cycle.
      await pass(() => expect(events.length).to.be.greaterThan(0));
      virtualizer.viewport = {
        scrollTop: 5000,
        scrollLeft: 0,
        width: 200,
        height: 200,
      };
      await pass(() => expect(events.length).to.be.greaterThan(1));

      const dest = virtualizer.element(500)!.scrollIntoView({block: 'start'});
      expect(dest).to.exist;
      expect(typeof dest.top).to.equal('number');
      // With ~100px estimated item size, item 500 should land somewhere
      // around scrollTop=50000 (well above zero).
      expect(dest.top!).to.be.greaterThan(0);
    });

    it('does not call native DOM scrollIntoView for in-range targets', async () => {
      const items = array(100);
      const {host, virtualizer, events} = await createManagedVirtualizer({
        items,
        viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
      });
      await pass(() => expect(events.length).to.be.greaterThan(0));

      // Pick an index that should be in the rendered range (small index,
      // viewport at top).
      const inRangeIndex = 0;

      // Stub each child's scrollIntoView to detect a native call. If the
      // virtualizer falls through to the in-range native path, one of
      // these stubs will fire.
      let nativeCalls = 0;
      for (const child of host.children) {
        (child as HTMLElement).scrollIntoView = () => {
          nativeCalls++;
        };
      }

      const dest = virtualizer
        .element(inRangeIndex)!
        .scrollIntoView({block: 'start'});

      expect(nativeCalls).to.equal(0);
      expect(typeof dest.top).to.equal('number');
    });

    it('fires scrollintoviewended with reason "cancelled" when an in-flight smooth scroll is aborted', async () => {
      // The intent contract — and `scrollintoviewended` — only applies
      // to `behavior: 'smooth'`. Instant scroll is synchronous and
      // doesn't register an intent, so signal abort after an instant
      // call has nothing to cancel.
      const items = array(1000);
      const {host, virtualizer, events} = await createManagedVirtualizer({
        items,
        viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
      });
      await pass(() => expect(events.length).to.be.greaterThan(0));

      const ended = collect<ScrollIntoViewEndedEvent>(
        host,
        'scrollintoviewended'
      );

      const ac = new AbortController();
      virtualizer
        .element(500)!
        .scrollIntoView({behavior: 'smooth', signal: ac.signal});
      ac.abort();

      expect(ended.length).to.equal(1);
      expect(ended[0].reason).to.equal('cancelled');
    });

    it('fires scrollintoviewended with reason "replaced" when a new smooth intent supersedes a prior one', async () => {
      const items = array(1000);
      const {host, virtualizer, events} = await createManagedVirtualizer({
        items,
        viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
      });
      await pass(() => expect(events.length).to.be.greaterThan(0));

      const ended = collect<ScrollIntoViewEndedEvent>(
        host,
        'scrollintoviewended'
      );

      virtualizer.element(500)!.scrollIntoView({behavior: 'smooth'});
      virtualizer.element(600)!.scrollIntoView({behavior: 'smooth'});

      expect(ended.length).to.equal(1);
      expect(ended[0].reason).to.equal('replaced');
    });

    it('a new instant scrollIntoView replaces an in-flight smooth intent', async () => {
      // Even though the new call is instant (no intent of its own),
      // any prior smooth intent should still be ended with reason
      // 'replaced' so the consumer can clean up its in-flight animation.
      const items = array(1000);
      const {host, virtualizer, events} = await createManagedVirtualizer({
        items,
        viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
      });
      await pass(() => expect(events.length).to.be.greaterThan(0));

      const ended = collect<ScrollIntoViewEndedEvent>(
        host,
        'scrollintoviewended'
      );

      virtualizer.element(500)!.scrollIntoView({behavior: 'smooth'});
      virtualizer.element(600)!.scrollIntoView(); // instant, default

      expect(ended.length).to.equal(1);
      expect(ended[0].reason).to.equal('replaced');
    });

    it('fires scrollintoviewended with reason "arrived" when the consumer pushes a viewport that converges on the destination', async () => {
      const items = array(1000);
      const {host, virtualizer, events} = await createManagedVirtualizer({
        items,
        viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
      });
      await pass(() => expect(events.length).to.be.greaterThan(0));

      const ended = collect<ScrollIntoViewEndedEvent>(
        host,
        'scrollintoviewended'
      );

      // At-rest arrival inference applies to `behavior: 'smooth'`
      // intents only; instant intents end via consumer abort or
      // replacement, not via at-rest detection.
      const dest = virtualizer
        .element(50)!
        .scrollIntoView({block: 'start', behavior: 'smooth'});
      const target = dest.top ?? 0;

      // The at-rest detection uses a window of two viewport samples.
      // Each updateView call (one per layout cycle) is one sample.
      // Setting viewport synchronously dedupes via the scheduler, so
      // multiple sets in the same microtask coalesce to one cycle; we
      // need two separate cycles, which means awaiting between pushes.
      //
      // Wait between pushes via setTimeout so the previous push's
      // microtask drains and a new layout cycle runs.
      virtualizer.viewport = {
        scrollTop: target,
        scrollLeft: 0,
        width: 200,
        height: 200,
      };
      await new Promise((resolve) => setTimeout(resolve, 50));
      virtualizer.viewport = {
        scrollTop: target,
        scrollLeft: 0,
        width: 200,
        height: 200,
      };

      await pass(() => expect(ended.length).to.be.greaterThan(0), 2000);
      expect(ended[0].reason).to.equal('arrived');
    });

    it('does not start an intent when the AbortSignal is already aborted', async () => {
      const items = array(1000);
      const {host, virtualizer, events} = await createManagedVirtualizer({
        items,
        viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
      });
      await pass(() => expect(events.length).to.be.greaterThan(0));

      const ended = collect<ScrollIntoViewEndedEvent>(
        host,
        'scrollintoviewended'
      );

      const ac = new AbortController();
      ac.abort();
      const dest = virtualizer
        .element(500)!
        .scrollIntoView({signal: ac.signal});

      // Destination still returned, but no intent started → no event.
      expect(typeof dest.top).to.equal('number');
      expect(ended.length).to.equal(0);
    });

    it('treats every scrollIntoView consistently regardless of in-range vs out-of-range', async () => {
      // Verifies no observable behavior split between an in-range index
      // (which previously took a native-scrollIntoView fast path) and an
      // out-of-range index. Using `behavior: 'smooth'` so the intent
      // contract applies to both: each call should produce a destination
      // and each should be cancellable via AbortSignal.
      const items = array(1000);
      const {host, virtualizer, events} = await createManagedVirtualizer({
        items,
        viewport: {scrollTop: 0, scrollLeft: 0, width: 200, height: 200},
      });
      await pass(() => expect(events.length).to.be.greaterThan(0));

      const ended = collect<ScrollIntoViewEndedEvent>(
        host,
        'scrollintoviewended'
      );

      const acIn = new AbortController();
      const destIn = virtualizer
        .element(0)! // in-range
        .scrollIntoView({behavior: 'smooth', signal: acIn.signal});
      acIn.abort();

      const acOut = new AbortController();
      const destOut = virtualizer
        .element(800)! // out-of-range
        .scrollIntoView({behavior: 'smooth', signal: acOut.signal});
      acOut.abort();

      expect(typeof destIn.top).to.equal('number');
      expect(typeof destOut.top).to.equal('number');
      expect(ended.length).to.equal(2);
      expect(ended.every((e) => e.reason === 'cancelled')).to.be.true;
    });

    it('event classes carry their expected shapes', async () => {
      // Verifies the event constructors and detail interfaces. (Detailed
      // estimation-refinement scenarios are covered indirectly by the
      // arrival/cancellation tests; here we just ensure the event types
      // are constructible and exposed correctly via the public events
      // module.)
      expect(new ScrollErrorEvent({top: 0, left: 0}).delta).to.deep.equal({
        top: 0,
        left: 0,
      });
      expect(
        new DestinationChangedEvent({top: 100, left: 0}).destination
      ).to.deep.equal({top: 100, left: 0});
      expect(new ScrollIntoViewEndedEvent('arrived').reason).to.equal(
        'arrived'
      );
      expect(new ScrollIntoViewEndedEvent('cancelled').reason).to.equal(
        'cancelled'
      );
      expect(new ScrollIntoViewEndedEvent('replaced').reason).to.equal(
        'replaced'
      );
    });
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
