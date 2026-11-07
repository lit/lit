/**
 * @license
 * Copyright The Lit Project Contributors.
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect} from '@open-wc/testing';
import {ignoreBenignErrors} from '../helpers.js';
import {
  virtualizerFixture,
  VirtualizerFixtureOptions,
} from '../virtualizer-test-utilities.js';

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function testScrollBackAfterJump(fixtureOptions: VirtualizerFixtureOptions) {
  ignoreBenignErrors(beforeEach, afterEach);

  it('honors a scroll to the top made while the layout is still settling after a jump to the end', async () => {
    const {host, virtualizer, scroller, scrollerController} =
      await virtualizerFixture(fixtureOptions);

    // Jump into a region whose items have not been measured yet. The flow
    // layout anchors on the last item and keeps reflowing around it until
    // the measurements settle.
    scroller.scrollTo({top: scrollerController.scrollHeight});
    await nextFrame();

    // Scroll back to the top before the layout has stabilized.
    scroller.scrollTo({top: 0});
    await virtualizer.layoutComplete;
    await nextFrame();
    await nextFrame();

    expect(scrollerController.scrollTop).to.be.lessThan(50);
    expect(host.querySelector('[id="0"]')).not.to.equal(null);
  });
}

describe('scrolling back while the flow layout is settling after a jump', () => {
  describe('using <lit-virtualizer> and virtualizer scrolling', () => {
    testScrollBackAfterJump({useDirective: false, scroller: true});
  });
  describe('using the virtualize() directive and virtualizer scrolling', () => {
    testScrollBackAfterJump({useDirective: true, scroller: true});
  });
  describe('using <lit-virtualizer> and window scrolling', () => {
    testScrollBackAfterJump({useDirective: false, scroller: false});
  });
});
