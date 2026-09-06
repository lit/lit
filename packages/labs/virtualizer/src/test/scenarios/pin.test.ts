/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect} from '@open-wc/testing';
import {first, last, ignoreBenignErrors, pass} from '../helpers.js';
import {virtualizerFixture} from '../virtualizer-test-utilities.js';
import {grid} from '../../layouts/grid.js';

describe('pin property', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  // Default fixture: 400x400 viewport, 50x50 items, 1000 items
  // Flow layout: 8 items visible (400 / 50)

  describe('flow layout', () => {
    it('should pin to start position', async () => {
      const {controller, inspector} = await virtualizerFixture({
        scroller: true,
      });

      controller.pin = {index: 100, block: 'start'};
      await controller.layoutComplete;

      await pass(() => {
        const visible = inspector.visibleChildElements;
        expect(first(visible).id).to.equal('100');
        expect(last(visible).id).to.equal('107');
      });
    });

    it('should pin to center position', async () => {
      const {controller, inspector} = await virtualizerFixture({
        scroller: true,
      });

      controller.pin = {index: 100, block: 'center'};
      await controller.layoutComplete;

      // Pinned item centered: half-visible items at each edge
      await pass(() => {
        const visible = inspector.visibleChildElements;
        expect(first(visible).id).to.equal('96');
        expect(last(visible).id).to.equal('104');
      });
    });

    it('should pin to end position', async () => {
      const {controller, inspector} = await virtualizerFixture({
        scroller: true,
      });

      controller.pin = {index: 100, block: 'end'};
      await controller.layoutComplete;

      await pass(() => {
        const visible = inspector.visibleChildElements;
        expect(first(visible).id).to.equal('93');
        expect(last(visible).id).to.equal('100');
      });
    });

    it('should pin to start position (virtualize directive)', async () => {
      const {controller, inspector} = await virtualizerFixture({
        useDirective: true,
        scroller: true,
      });

      controller.pin = {index: 100, block: 'start'};
      await controller.layoutComplete;

      await pass(() => {
        const visible = inspector.visibleChildElements;
        expect(first(visible).id).to.equal('100');
        expect(last(visible).id).to.equal('107');
      });
    });
  });

  // Grid layout: 400x400 viewport, 50x50 items, 0 gap, 0 padding
  // 8 columns (400 / 50), 8 visible rows
  // Pin index 100: row 12 (floor(100/8)), column 4 (100 % 8)

  describe('grid layout', () => {
    const gridLayout = grid({
      itemSize: {width: '50px', height: '50px'},
      gap: '0px',
    });

    it('should pin to start position', async () => {
      const {controller, inspector} = await virtualizerFixture({
        scroller: true,
        layout: gridLayout,
      });

      controller.pin = {index: 100, block: 'start'};
      await controller.layoutComplete;

      // Row 12 at top: rows 12–19 visible, items 96–159
      await pass(() => {
        const visible = inspector.visibleChildElements;
        expect(first(visible).id).to.equal('96');
        expect(last(visible).id).to.equal('159');
      });
    });

    it('should pin to center position', async () => {
      const {controller, inspector} = await virtualizerFixture({
        scroller: true,
        layout: gridLayout,
      });

      controller.pin = {index: 100, block: 'center'};
      await controller.layoutComplete;

      // Row 12 centered: rows 8–16 visible (half-visible at edges), items 64–135
      await pass(() => {
        const visible = inspector.visibleChildElements;
        expect(first(visible).id).to.equal('64');
        expect(last(visible).id).to.equal('135');
      });
    });

    it('should pin to end position', async () => {
      const {controller, inspector} = await virtualizerFixture({
        scroller: true,
        layout: gridLayout,
      });

      controller.pin = {index: 100, block: 'end'};
      await controller.layoutComplete;

      // Row 12 at bottom: rows 5–12 visible, items 40–103
      await pass(() => {
        const visible = inspector.visibleChildElements;
        expect(first(visible).id).to.equal('40');
        expect(last(visible).id).to.equal('103');
      });
    });
  });

  describe('deprecation warning', () => {
    it('should emit a deprecation warning when pin is in layout config', async () => {
      const warnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        warnings.push(String(args[0]));
      };

      try {
        await virtualizerFixture({
          scroller: true,
          layout: {pin: {index: 5, block: 'start'}},
        });

        expect(
          warnings.some((w) => w.includes('pin') && w.includes('deprecated'))
        ).to.be.true;
      } finally {
        console.warn = originalWarn;
      }
    });
  });
});
