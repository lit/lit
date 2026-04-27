/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {array, ignoreBenignErrors, pass, until} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {ScrollIntoViewEndedEvent} from '../../events.js';
import {expect, html, fixture} from '@open-wc/testing';

/**
 * Cross-scroll-mode tests for the public scrollIntoView API contract:
 * - synchronous return of destination coordinates
 * - AbortSignal cancellation
 * - the `scrollintoviewended` event firing in DOM-backed scroll modes
 *   (managed-mode coverage lives in `managed-viewport.test.ts`)
 *
 * These tests exercise the self-scroller mode (`<lit-virtualizer scroller>`)
 * because it sets up a deterministic, isolated scroll container. The
 * ancestor-scroller mode shares the same `BaseDomScrollSource` code path,
 * so the contract guarantees there are the same.
 */
describe('scrollIntoView contract (DOM scroll modes)', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  async function createSelfScroller(items: number[]) {
    const container = await fixture(
      html`<div>
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
          .items=${items}
          .renderItem=${(item: number) => html`<div class="item">${item}</div>`}
        ></lit-virtualizer>
      </div>`
    );
    const virtualizer = await until(
      () => container.querySelector('lit-virtualizer') as LitVirtualizer
    );
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);
    // Wait for first render so the layout has measurements.
    await pass(() => expect(virtualizer.children.length).to.be.greaterThan(0));
    return {container, virtualizer};
  }

  it('scrollIntoView returns destination coordinates synchronously', async () => {
    const {virtualizer} = await createSelfScroller(array(200));
    // Allow layout to settle so scrollSize is populated and the
    // returned destination isn't clamped to zero by an empty scrollable
    // bound.
    await virtualizer.layoutComplete;

    const dest = virtualizer.element(50)!.scrollIntoView({block: 'start'});

    expect(dest).to.exist;
    expect(typeof dest.top).to.equal('number');
    // Items are 50px tall; index 50 should be around scrollTop=2500.
    expect(dest.top!).to.be.greaterThan(0);
  });

  it('AbortSignal cancellation: aborting an in-flight smooth scroll fires scrollintoviewended("cancelled")', async () => {
    const {virtualizer} = await createSelfScroller(array(200));

    const ended: ScrollIntoViewEndedEvent[] = [];
    virtualizer.addEventListener('scrollintoviewended', (e) =>
      ended.push(e as ScrollIntoViewEndedEvent)
    );

    const ac = new AbortController();
    virtualizer
      .element(100)!
      .scrollIntoView({behavior: 'smooth', signal: ac.signal});

    // Abort almost immediately, before the smooth scroll arrives.
    ac.abort();

    expect(ended.length).to.equal(1);
    expect(ended[0].reason).to.equal('cancelled');
  });

  it('AbortSignal already-aborted at call time: no scroll is initiated and no event fires', async () => {
    const {virtualizer} = await createSelfScroller(array(200));

    const ended: ScrollIntoViewEndedEvent[] = [];
    virtualizer.addEventListener('scrollintoviewended', (e) =>
      ended.push(e as ScrollIntoViewEndedEvent)
    );

    const ac = new AbortController();
    ac.abort();

    const dest = virtualizer
      .element(100)!
      .scrollIntoView({behavior: 'smooth', signal: ac.signal});

    // Destination still computed and returned, but no intent started.
    expect(typeof dest.top).to.equal('number');
    expect(ended.length).to.equal(0);
  });

  it('Replacement: a new smooth scroll fires scrollintoviewended("replaced") for the prior intent', async () => {
    const {virtualizer} = await createSelfScroller(array(200));

    const ended: ScrollIntoViewEndedEvent[] = [];
    virtualizer.addEventListener('scrollintoviewended', (e) =>
      ended.push(e as ScrollIntoViewEndedEvent)
    );

    virtualizer.element(50)!.scrollIntoView({behavior: 'smooth'});
    virtualizer.element(100)!.scrollIntoView({behavior: 'smooth'});

    expect(ended.length).to.equal(1);
    expect(ended[0].reason).to.equal('replaced');
  });

  it('Arrival: smooth scrollIntoView fires scrollintoviewended("arrived") when it reaches the destination', async () => {
    const {virtualizer} = await createSelfScroller(array(50));

    const ended: ScrollIntoViewEndedEvent[] = [];
    virtualizer.addEventListener('scrollintoviewended', (e) =>
      ended.push(e as ScrollIntoViewEndedEvent)
    );

    virtualizer.element(20)!.scrollIntoView({behavior: 'smooth'});

    // Wait for the smooth scroll to complete. Browser smooth scrolls
    // usually settle within ~300ms; allow some extra slack.
    await pass(() => expect(ended.length).to.be.greaterThan(0), 3000);
    expect(ended[0].reason).to.equal('arrived');
  });
});
