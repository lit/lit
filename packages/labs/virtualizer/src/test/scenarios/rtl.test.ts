/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect, html} from '@open-wc/testing';
import {
  virtualizerFixture,
  VirtualizerFixtureOptions,
} from '../virtualizer-test-utilities.js';
import {ignoreBenignErrors, pass, until} from '../helpers.js';
import {RangeChangedEvent} from '../../events.js';

// ─── Shared fixture styles ──────────────────────────────────────────────────

/** 300×300 viewport with direction:rtl and a 16px inline-start margin on items */
const rtlFixtureStyles = html`
  <style>
    section {
      height: 300px;
      width: 300px;
    }

    lit-virtualizer[scroller],
    .virtualizerHost[scroller] {
      height: 300px;
      width: 300px;
      direction: rtl;
    }

    .item {
      width: 60px;
      height: 60px;
      margin-inline-start: 16px;
    }
  </style>
`;

/** Same viewport without rtl — used to verify LTR is unaffected */
const ltrFixtureStyles = html`
  <style>
    section {
      height: 300px;
      width: 300px;
    }

    lit-virtualizer[scroller],
    .virtualizerHost[scroller] {
      height: 300px;
      width: 300px;
    }

    .item {
      width: 60px;
      height: 60px;
    }
  </style>
`;

/** 300×300 viewport with direction:rtl and a *vertical* layout */
const rtlVerticalFixtureStyles = html`
  <style>
    section {
      height: 300px;
      width: 300px;
    }

    lit-virtualizer[scroller],
    .virtualizerHost[scroller] {
      height: 300px;
      width: 300px;
      direction: rtl;
    }

    .item {
      width: 60px;
      height: 60px;
    }
  </style>
`;

// ─── Fixture option sets ────────────────────────────────────────────────────

const horizontalRtlOptions: VirtualizerFixtureOptions = {
  scroller: true,
  layout: {direction: 'horizontal'},
  fixtureStyles: rtlFixtureStyles,
  nItems: 200,
};

const horizontalLtrOptions: VirtualizerFixtureOptions = {
  scroller: true,
  layout: {direction: 'horizontal'},
  fixtureStyles: ltrFixtureStyles,
  nItems: 200,
};

const verticalRtlOptions: VirtualizerFixtureOptions = {
  scroller: true,
  fixtureStyles: rtlVerticalFixtureStyles,
  nItems: 200,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the [virtualizer-sizer] element from the host. */
function getSizer(host: HTMLElement): HTMLElement {
  return host.querySelector('[virtualizer-sizer]') as HTMLElement;
}

/** Parses the X translation from a `translate(Xpx, Ypx)` string. */
function getTranslateX(transform: string): number {
  const m = transform.match(/translate\((-?[\d.]+)px/);
  return m ? parseFloat(m[1]) : 0;
}

// ─── Test suites ──────────────────────────────────────────────────────────────

describe('rtl + horizontal layout', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  // ── Child element positioning ────────────────────────────────────────────

  describe('child element positioning', () => {
    it('positions lower indexes from right to left', async () => {
      const {host} = await virtualizerFixture(horizontalRtlOptions);

      const first = host.querySelector('[id="0"]') as HTMLElement;
      const second = host.querySelector('[id="1"]') as HTMLElement;
      expect(first).to.be.instanceOf(HTMLElement);
      expect(second).to.be.instanceOf(HTMLElement);

      const firstLeft = first.getBoundingClientRect().left;
      const secondLeft = second.getBoundingClientRect().left;
      expect(firstLeft).to.be.greaterThan(
        secondLeft,
        'item 0 should be to the right of item 1'
      );
    });

    it('anchors children from the right edge (style.right) not left', async () => {
      const {host} = await virtualizerFixture(horizontalRtlOptions);

      // Items that have a leading margin get an xOffset, which the
      // virtualizer must apply via style.right in RTL (not style.left).
      const item = host.querySelector('[id="0"]') as HTMLElement;
      expect(item).to.be.instanceOf(HTMLElement);
      expect(item.style.left).to.equal('auto');
      expect(item.style.right).not.to.equal('');
    });

    it('uses a negative translateX in the child transform for RTL', async () => {
      const {host} = await virtualizerFixture(horizontalRtlOptions);

      // Item 1 is to the left of item 0, so its layout position > 0 and
      // translateX should be negative to flip it leftward from the right edge.
      const second = host.querySelector('[id="1"]') as HTMLElement;
      expect(second).to.be.instanceOf(HTMLElement);
      const tx = getTranslateX(second.style.transform);
      expect(tx).to.be.lessThan(0, 'translateX should be negative in RTL');
    });

    it('applies inline-start margin consistently in rtl', async () => {
      const {host} = await virtualizerFixture(horizontalRtlOptions);

      await pass(() => {
        const first = host.querySelector('[id="0"]') as HTMLElement;
        const second = host.querySelector('[id="1"]') as HTMLElement;
        expect(first).to.be.instanceOf(HTMLElement);
        expect(second).to.be.instanceOf(HTMLElement);

        const hostRect = host.getBoundingClientRect();
        const firstRect = first.getBoundingClientRect();
        const secondRect = second.getBoundingClientRect();
        // Gap from viewport inline-start (right) to first item's right edge
        const startGap = hostRect.right - firstRect.right;
        // Gap between first item's left edge and second item's right edge
        const betweenGap = firstRect.left - secondRect.right;
        expect(startGap).to.be.closeTo(
          betweenGap,
          1,
          'inline-start margin should be equal at container edge and between items'
        );
      }, 2000);
    });
  });

  // ── Sizer element ───────────────────────────────────────────────────────

  describe('sizer element', () => {
    it('anchors the sizer to the right edge of the container', async () => {
      const {host} = await virtualizerFixture(horizontalRtlOptions);
      await pass(() => {
        const sizer = getSizer(host);
        expect(sizer).to.be.instanceOf(HTMLElement);
        // right:0 anchors from the right so translate(-totalWidth, 0)
        // extends the scroll area leftward.
        expect(sizer.style.right).to.equal('0px');
        expect(sizer.style.left).to.equal('auto');
      });
    });

    it('applies a negative (leftward) translateX to the sizer', async () => {
      const {host} = await virtualizerFixture(horizontalRtlOptions);
      await pass(() => {
        const sizer = getSizer(host);
        expect(sizer).to.be.instanceOf(HTMLElement);
        const tx = getTranslateX(sizer.style.transform);
        expect(tx).to.be.lessThan(
          0,
          'sizer translateX should be negative in RTL to extend leftward'
        );
      });
    });

    it('creates a scroll area wider than the viewport', async () => {
      const {host} = await virtualizerFixture(horizontalRtlOptions);
      await pass(() => {
        expect(host.scrollWidth).to.be.greaterThan(
          host.clientWidth,
          'scrollWidth should exceed clientWidth for 200 items'
        );
      });
    });
  });

  // ── Virtualization ──────────────────────────────────────────────────────

  describe('virtualization', () => {
    it('renders only a subset of the 200 items initially', async () => {
      const {host} = await virtualizerFixture(horizontalRtlOptions);
      // With 200 items and a 300px viewport, far fewer than 200 should be
      // in the DOM at once.
      const rendered = host.querySelectorAll(
        ':not([virtualizer-sizer])'
      ).length;
      expect(rendered).to.be.lessThan(
        50,
        'virtualizer should not render all 200 items at once'
      );
    });

    it('removes out-of-view items and renders new ones when scrolled', async () => {
      const {host, virtualizer} =
        await virtualizerFixture(horizontalRtlOptions);

      // Item 0 should be visible at load time.
      expect(host.querySelector('[id="0"]')).to.be.instanceOf(HTMLElement);

      // Scroll far using the virtualizer API so that the browser RTL scroll
      // model is handled correctly internally.
      virtualizer.element(150)?.scrollIntoView();
      await virtualizer.layoutComplete;

      // Item 150 should now be in the DOM.
      expect(host.querySelector('[id="150"]')).to.be.instanceOf(HTMLElement);
      // Item 0 should no longer be rendered at this scroll position.
      expect(host.querySelector('[id="0"]')).to.equal(null);
    });

    it('supports scrolling a virtual item into view', async () => {
      const {host, virtualizer} =
        await virtualizerFixture(horizontalRtlOptions);

      virtualizer.element(40)?.scrollIntoView({block: 'start'});
      await virtualizer.layoutComplete;

      expect(host.querySelector('[id="40"]')).to.be.instanceOf(HTMLElement);
    });

    it('supports scrolling the last item into view', async () => {
      const {host, virtualizer} =
        await virtualizerFixture(horizontalRtlOptions);

      virtualizer.element(199)?.scrollIntoView({block: 'start'});
      await virtualizer.layoutComplete;

      expect(host.querySelector('[id="199"]')).to.be.instanceOf(HTMLElement);
    });
  });

  // ── Events ───────────────────────────────────────────────────────────────

  describe('events', () => {
    it('fires rangeChanged when items are scrolled in RTL', async () => {
      const {host, virtualizer} =
        await virtualizerFixture(horizontalRtlOptions);
      const events: RangeChangedEvent[] = [];
      host.addEventListener('rangeChanged', (e) =>
        events.push(e as RangeChangedEvent)
      );

      virtualizer.element(100)?.scrollIntoView();
      await until(() => events.length > 0, 2000);

      const last = events[events.length - 1];
      expect(last.first).to.be.greaterThan(0);
      expect(last.last).to.be.greaterThan(last.first);
      // Item 100 should be within the new range.
      expect(last.first).to.be.lessThanOrEqual(100);
      expect(last.last).to.be.greaterThanOrEqual(100);
    });
  });
});

// ─── Vertical layout with RTL ─────────────────────────────────────────────

describe('rtl direction with vertical layout', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('does not affect vertical item positioning (items still stack top-to-bottom)', async () => {
    const {host} = await virtualizerFixture(verticalRtlOptions);

    const first = host.querySelector('[id="0"]') as HTMLElement;
    const second = host.querySelector('[id="1"]') as HTMLElement;
    expect(first).to.be.instanceOf(HTMLElement);
    expect(second).to.be.instanceOf(HTMLElement);

    const firstTop = first.getBoundingClientRect().top;
    const secondTop = second.getBoundingClientRect().top;
    // Vertical layout: item 0 must appear *above* item 1 regardless of RTL.
    expect(firstTop).to.be.lessThan(
      secondTop,
      'vertical layout should be unaffected by RTL direction'
    );
  });

  it('anchors vertical rtl children from the right edge', async () => {
    const {host} = await virtualizerFixture(verticalRtlOptions);

    const first = host.querySelector('[id="0"]') as HTMLElement;
    expect(first).to.be.instanceOf(HTMLElement);

    await pass(() => {
      const hostRect = host.getBoundingClientRect();
      const firstRect = first.getBoundingClientRect();
      expect(first.style.left).to.equal('auto');
      expect(first.style.right).to.equal('0px');
      expect(firstRect.right).to.be.closeTo(
        hostRect.right,
        1,
        'vertical rtl items should align to the right edge'
      );
    });
  });

  it('sizer stays anchored to the right edge in vertical rtl', async () => {
    const {host} = await virtualizerFixture(verticalRtlOptions);
    await pass(() => {
      const sizer = getSizer(host);
      expect(sizer).to.be.instanceOf(HTMLElement);
      expect(sizer.style.left).to.equal('auto');
      expect(sizer.style.right).to.equal('0px');
      const tx = getTranslateX(sizer.style.transform);
      expect(tx).to.be.lessThanOrEqual(
        0,
        'rtl sizer should not translate rightward'
      );
    });
  });
});

// ─── LTR comparison ──────────────────────────────────────────────────────────

describe('ltr horizontal layout (non-regression)', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('item 0 appears to the left of item 1', async () => {
    const {host} = await virtualizerFixture(horizontalLtrOptions);

    const first = host.querySelector('[id="0"]') as HTMLElement;
    const second = host.querySelector('[id="1"]') as HTMLElement;
    expect(first).to.be.instanceOf(HTMLElement);
    expect(second).to.be.instanceOf(HTMLElement);

    expect(first.getBoundingClientRect().left).to.be.lessThan(
      second.getBoundingClientRect().left,
      'in LTR item 0 should be to the left of item 1'
    );
  });

  it('sizer uses positive translateX and no right anchor in LTR', async () => {
    const {host} = await virtualizerFixture(horizontalLtrOptions);
    await pass(() => {
      const sizer = getSizer(host);
      expect(sizer).to.be.instanceOf(HTMLElement);
      expect(sizer.style.left).to.equal('0px');
      expect(sizer.style.right).to.equal(
        'auto',
        'LTR sizer should stay left-anchored'
      );
      const tx = getTranslateX(sizer.style.transform);
      expect(tx).to.be.greaterThan(
        0,
        'LTR sizer translateX should be positive (extends rightward)'
      );
    });
  });

  it('children anchor via style.left (not right) in LTR', async () => {
    const {host} = await virtualizerFixture(horizontalLtrOptions);
    const item = host.querySelector('[id="1"]') as HTMLElement;
    expect(item).to.be.instanceOf(HTMLElement);
    expect(item.style.left).not.to.equal('');
    expect(item.style.right).to.equal('auto');
  });
});
