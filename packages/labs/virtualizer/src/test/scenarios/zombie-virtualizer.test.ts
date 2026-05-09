/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect, fixture, html} from '@open-wc/testing';
import {virtualize, virtualizerRef} from '../../virtualize.js';
import type {VirtualizerHostElement} from '../../Virtualizer.js';
import {ignoreBenignErrors} from '../helpers.js';

// Regression: a bare `virtualize()` directive whose host is removed from
// the DOM without the containing lit-html template being cleared never
// receives `disconnected()` — `AsyncDirective` has no auto-reconnect
// hook and nothing calls `setConnected(false)` in that scenario. Without
// the defensive guards in `Virtualizer`, the stranded instance keeps
// reacting to scroll events on its shared ancestor scroller and applies
// scroll corrections based on its (now 0-measured) children, hijacking
// subsequent programmatic or user scrolls. See lit/lit#5314.
//
// The downstream symptom (scroll hijack) has timing- and state-dependent
// preconditions that don't reliably reproduce with a single zombie in
// isolation. So this test directly checks the guard's proximate
// behavior: after detach, the Virtualizer's scroll-event reaction path
// must not run. We observe that via the first side-effect inside
// `_handleScrollEvent` — the `unpin()` call on the layout — which runs
// on every non-correcting scroll event in the unfixed code.
describe('zombie virtualizer (bare virtualize() directive, detached host)', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  let filler: HTMLElement;

  beforeEach(() => {
    filler = document.createElement('div');
    filler.style.height = '10000px';
    filler.style.width = '1px';
    document.body.appendChild(filler);
  });

  afterEach(() => {
    window.scrollTo(0, 0);
    filler.remove();
  });

  it('does not react to scroll events after its host is detached', async () => {
    const items = Array.from({length: 100}, (_, i) => i);
    const renderItem = (n: number) =>
      html`<div style="height:50px;width:50px;">${n}</div>`;
    const container = (await fixture(html`
      <section>
        <div class="virtualizerHost">${virtualize({items, renderItem})}</div>
      </section>
    `)) as HTMLElement;
    const host = container.querySelector(
      '.virtualizerHost'
    ) as VirtualizerHostElement;
    await new Promise((r) => setTimeout(r, 100));

    const virt = host[virtualizerRef]!;
    // Bracket access to reach the internal layout field. Spy on the
    // first externally-observable effect of `_handleScrollEvent`: a
    // non-correcting scroll calls `_layout.unpin()` before reaching
    // any other branch.
    const layout = (virt as unknown as {_layout: {unpin: () => void}})._layout;
    let unpinCount = 0;
    const origUnpin = layout.unpin.bind(layout);
    layout.unpin = () => {
      unpinCount++;
      origUnpin();
    };

    // Sanity check: the spy catches scroll-event reactions while
    // connected. Scroll once to a non-zero position and verify unpin
    // ran at least once on the live virtualizer.
    window.scrollTo({top: 300});
    await new Promise((r) => setTimeout(r, 100));
    expect(unpinCount).to.be.greaterThan(
      0,
      'spy should have observed scroll-event reactions while the virtualizer was connected'
    );

    // Detach without clearing the template — the directive is now
    // stranded (no `setConnected(false)` arrives) and the Virtualizer
    // is still referenced, with its scroll listener still attached to
    // `window` and its layout still alive.
    container.remove();

    // Reset the counter and drive several scrolls that would normally
    // make the Virtualizer react.
    await new Promise((r) => setTimeout(r, 50));
    const baselineUnpin = unpinCount;
    window.scrollTo({top: 1000});
    await new Promise((r) => setTimeout(r, 50));
    window.scrollTo({top: 2000});
    await new Promise((r) => setTimeout(r, 50));
    window.scrollTo({top: 500});
    await new Promise((r) => setTimeout(r, 100));

    // With the fix, `_handleScrollEvent` early-returns when the host is
    // out of the DOM, so `unpin` is never reached.
    expect(unpinCount).to.equal(
      baselineUnpin,
      'detached virtualizer must not react to scrolls on the shared ancestor'
    );
  });
});
