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
import {ignoreBenignErrors, pass} from '../helpers.js';

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
      margin-inline-start: 16px;
    }
  </style>
`;

const horizontalRtlOptions: VirtualizerFixtureOptions = {
  scroller: true,
  layout: {direction: 'horizontal'},
  fixtureStyles: rtlFixtureStyles,
  nItems: 200,
};

describe('rtl + horizontal layout', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('positions lower indexes from right to left', async () => {
    const {host} = await virtualizerFixture(horizontalRtlOptions);

    const first = host.querySelector('[id="0"]') as HTMLElement;
    const second = host.querySelector('[id="1"]') as HTMLElement;
    expect(first).to.be.instanceOf(HTMLElement);
    expect(second).to.be.instanceOf(HTMLElement);

    const firstLeft = first.getBoundingClientRect().left;
    const secondLeft = second.getBoundingClientRect().left;
    expect(firstLeft).to.be.greaterThan(secondLeft);
  });

  it('supports scrolling virtual items into view', async () => {
    const {host, virtualizer} = await virtualizerFixture(horizontalRtlOptions);

    virtualizer.element(40)?.scrollIntoView({block: 'start'});
    await virtualizer.layoutComplete;

    expect(host.querySelector('[id="40"]')).to.be.instanceOf(HTMLElement);
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
      const startGap = hostRect.right - firstRect.right;
      const betweenGap = firstRect.left - secondRect.right;
      expect(startGap).to.be.closeTo(betweenGap, 1);
    }, 2000);
  });
});
