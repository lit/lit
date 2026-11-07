/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect, html} from '@open-wc/testing';
import {ignoreBenignErrors, pass} from '../helpers.js';
import {
  virtualizerFixture,
  observeScroll,
  observeScrollUntilReached,
} from '../virtualizer-test-utilities.js';
import {masonry} from '../../layouts/masonry.js';

/**
 * Tests for the `axis` property which controls whether the virtualizer
 * scrolls along the block or inline axis. When `axis='inline'`, the
 * virtualizer swaps the host's writing-mode to virtualize along the
 * inline axis, then restores children's writing-mode to the context value.
 */

describe('axis property', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  describe('axis="inline" with scroller=true (horizontal-tb + ltr)', () => {
    it('should scroll horizontally', async () => {
      const fixtureStyles = html`
        <style>
          section {
            height: 400px;
            width: 400px;
          }
          lit-virtualizer[scroller],
          .virtualizerHost[scroller] {
            height: 400px;
            width: 400px;
          }
        </style>
      `;

      const {host, scroller} = await virtualizerFixture({
        useDirective: false,
        scroller: true,
        axis: 'inline',
        fixtureStyles,
      });

      // The host should have a swapped writing-mode (vertical-lr for ltr context)
      const hostStyle = getComputedStyle(host);
      expect(hostStyle.writingMode).to.equal('vertical-lr');

      // Items should scroll horizontally (via scrollLeft)
      const {startPos, endPos, events} = await observeScrollUntilReached(
        scroller,
        () => scroller.scrollTo({left: 2000, behavior: 'smooth'}),
        2000,
        'left'
      );

      expect(startPos.left).to.equal(0);
      expect(endPos.left).to.equal(2000);
      expect(events.length).to.be.greaterThan(0);
    });

    it('should restore children writing-mode to context value', async () => {
      const fixtureStyles = html`
        <style>
          section {
            height: 400px;
            width: 400px;
          }
          lit-virtualizer[scroller],
          .virtualizerHost[scroller] {
            height: 400px;
            width: 400px;
          }
        </style>
      `;

      const {host} = await virtualizerFixture({
        useDirective: false,
        scroller: true,
        axis: 'inline',
        fixtureStyles,
      });

      // Host should have swapped writing-mode
      expect(getComputedStyle(host).writingMode).to.equal('vertical-lr');

      // Children should have the context (original) writing-mode restored
      await pass(() => {
        const children = host.querySelectorAll(':not([virtualizer-sizer])');
        expect(children.length).to.be.greaterThan(0);
        for (const child of children) {
          const childStyle = getComputedStyle(child);
          expect(childStyle.writingMode).to.equal('horizontal-tb');
        }
      });
    });
  });

  describe('axis="inline" with virtualize directive', () => {
    it('should scroll horizontally', async () => {
      const fixtureStyles = html`
        <style>
          section {
            height: 400px;
            width: 400px;
          }
          .virtualizerHost[scroller] {
            height: 400px;
            width: 400px;
          }
        </style>
      `;

      const {host, scroller} = await virtualizerFixture({
        useDirective: true,
        scroller: true,
        axis: 'inline',
        fixtureStyles,
      });

      // The host should have a swapped writing-mode
      const hostStyle = getComputedStyle(host);
      expect(hostStyle.writingMode).to.equal('vertical-lr');

      // Items should scroll horizontally
      const {startPos, endPos} = await observeScrollUntilReached(
        scroller,
        () => scroller.scrollTo({left: 2000, behavior: 'smooth'}),
        2000,
        'left'
      );

      expect(startPos.left).to.equal(0);
      expect(endPos.left).to.equal(2000);
    });
  });

  describe('axis="inline" with scroller=true (horizontal-tb + rtl)', () => {
    it('should use vertical-rl writing-mode for RTL context', async () => {
      const fixtureStyles = html`
        <style>
          section {
            height: 400px;
            width: 400px;
            direction: rtl;
          }
          lit-virtualizer[scroller],
          .virtualizerHost[scroller] {
            height: 400px;
            width: 400px;
          }
        </style>
      `;

      const {host} = await virtualizerFixture({
        useDirective: false,
        scroller: true,
        axis: 'inline',
        fixtureStyles,
      });

      // For RTL context, the swapped writing-mode should be vertical-rl
      const hostStyle = getComputedStyle(host);
      expect(hostStyle.writingMode).to.equal('vertical-rl');

      // Children should have horizontal-tb restored
      await pass(() => {
        const children = host.querySelectorAll(':not([virtualizer-sizer])');
        expect(children.length).to.be.greaterThan(0);
        for (const child of children) {
          const childStyle = getComputedStyle(child);
          expect(childStyle.writingMode).to.equal('horizontal-tb');
        }
      });
    });
  });

  describe('axis="inline" with window scrolling', () => {
    it('should scroll horizontally with window as scroller', async () => {
      const fixtureStyles = html`
        <style>
          section {
            height: 400px;
            width: 400px;
          }
        </style>
      `;

      const {host} = await virtualizerFixture({
        useDirective: false,
        scroller: false,
        axis: 'inline',
        fixtureStyles,
      });

      // The host should have a swapped writing-mode
      const hostStyle = getComputedStyle(host);
      expect(hostStyle.writingMode).to.equal('vertical-lr');

      // In vertical-lr, the block axis is horizontal (scrollLeft).
      // The document should have scrollable width. Poll rather than
      // wait a fixed interval, since the writing-mode swap triggers a
      // browser reflow that can resolve at an indeterminate moment.
      await pass(() => {
        expect(document.documentElement.scrollWidth).to.be.greaterThan(
          document.documentElement.clientWidth
        );
      });
    });
  });

  describe('axis="block" (default)', () => {
    it('should scroll vertically by default', async () => {
      const fixtureStyles = html`
        <style>
          section {
            height: 400px;
            width: 400px;
          }
          lit-virtualizer[scroller] {
            height: 400px;
            width: 400px;
          }
        </style>
      `;

      const {host, scroller} = await virtualizerFixture({
        useDirective: false,
        scroller: true,
        fixtureStyles,
      });

      // No writing-mode swap
      const hostStyle = getComputedStyle(host);
      expect(hostStyle.writingMode).to.equal('horizontal-tb');

      // Items should scroll vertically
      const {startPos, endPos} = await observeScroll(scroller, () =>
        scroller.scrollTo({top: 2000, behavior: 'smooth'})
      );

      expect(startPos.top).to.equal(0);
      expect(endPos.top).to.equal(2000);
    });
  });

  describe('axis="inline" + masonry (aspect-ratio regression)', () => {
    // Regression test for the unconditional `size1 = itemSize2 / aspectRatio`
    // formula in masonry: under axis="inline" the virtualizer's effective
    // writing-mode is vertical-lr/rl, so the block axis is visually
    // horizontal. A caller that returns visual `width / height` (typical
    // for photos) should see items rendered with that visual ratio.
    it('renders items with the caller-provided visual aspect ratio', async () => {
      type AspectItem = {aspectRatio: number};
      const items: AspectItem[] = new Array(20)
        .fill(null)
        .map(() => ({aspectRatio: 2}));

      const {host} = await virtualizerFixture<AspectItem>({
        useDirective: false,
        scroller: true,
        axis: 'inline',
        items,
        renderItem: (item) => html`<div>${item.aspectRatio.toFixed(1)}</div>`,
        layout: masonry({
          itemSize: '100px',
          flex: false,
          gap: '0px',
          getAspectRatio: (item) => (item as AspectItem).aspectRatio,
        }),
      });

      // Poll to allow an initial measurement cycle; the inlineSize/blockSize
      // swap in `_positionChildren` depends on child layout info becoming
      // available, which may take one or more frames after mount.
      await pass(() => {
        const firstChild = host.querySelector(
          ':not([virtualizer-sizer])'
        ) as HTMLElement | null;
        expect(firstChild).to.not.equal(null);
        const rect = firstChild!.getBoundingClientRect();
        expect(rect.width).to.be.greaterThan(0);
        expect(rect.height).to.be.greaterThan(0);
        const visualRatio = rect.width / rect.height;
        expect(visualRatio).to.be.closeTo(2, 0.2);
      });
    });
  });

  describe('axis="inline" with vertical-lr context', () => {
    it('should swap to horizontal-tb for inline scrolling', async () => {
      const fixtureStyles = html`
        <style>
          section {
            height: 400px;
            width: 400px;
            writing-mode: vertical-lr;
          }
          lit-virtualizer[scroller] {
            height: 400px;
            width: 400px;
          }
        </style>
      `;

      const {host} = await virtualizerFixture({
        useDirective: false,
        scroller: true,
        axis: 'inline',
        fixtureStyles,
      });

      // For vertical-lr context, inline axis is vertical, so swapping
      // should produce horizontal-tb
      const hostStyle = getComputedStyle(host);
      expect(hostStyle.writingMode).to.equal('horizontal-tb');

      // Children should have vertical-lr restored
      await pass(() => {
        const children = host.querySelectorAll(':not([virtualizer-sizer])');
        expect(children.length).to.be.greaterThan(0);
        for (const child of children) {
          const childStyle = getComputedStyle(child);
          expect(childStyle.writingMode).to.equal('vertical-lr');
        }
      });
    });
  });
});
