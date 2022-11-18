/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect} from '@open-wc/testing';
import {ignoreBenignErrors} from '../helpers.js';
import {
  virtualizerFixture,
  VirtualizerFixtureOptions,
  observeScroll,
} from '../virtualizer-test-utilities.js';
import {BaseLayoutConfig} from '../../layouts/shared/Layout.js';

type Coordinate = 'top' | 'left';

function getCoordinate(fixtureOptions: VirtualizerFixtureOptions) {
  const layout = fixtureOptions.layout as BaseLayoutConfig | undefined;
  const direction = layout?.direction ?? 'vertical';
  const coordinate: Coordinate = direction === 'vertical' ? 'top' : 'left';
  const crossCoordinate: Coordinate = coordinate === 'top' ? 'left' : 'top';
  return {coordinate, crossCoordinate};
}

function testBasicScrolling(fixtureOptions: VirtualizerFixtureOptions) {
  ignoreBenignErrors(beforeEach, afterEach);

  const {coordinate} = getCoordinate(fixtureOptions);

  describe('smooth scrolling', () => {
    it('should take some time and end up where it is supposed to', async () => {
      const {scroller, fixtureCleanup} = await virtualizerFixture(
        fixtureOptions
      );
      const {startPos, endPos, events, duration} = await observeScroll(
        scroller,
        () => scroller.scrollTo({[coordinate]: 2000, behavior: 'smooth'})
      );
      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(2000);
      expect(events.length).to.be.greaterThan(1);
      expect(duration).to.be.greaterThan(0);
      fixtureCleanup();
    });
  });

  describe('instant scrolling', () => {
    it('should take no time and end up where it is supposed to', async () => {
      const {scroller, scrollerController, fixtureCleanup} =
        await virtualizerFixture(fixtureOptions);
      const {maxScrollLeft, maxScrollTop} = scrollerController;
      const {startPos, endPos, events, duration} = await observeScroll(
        scroller,
        () => scroller.scrollTo({[coordinate]: 2000})
      );
      console.log('MAX', {maxScrollLeft, maxScrollTop});
      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(2000);
      expect(events.length).to.equal(1);
      expect(duration).to.equal(0);
      fixtureCleanup();
    });
  });

  describe('trying to smoothly scroll to the current position', () => {
    it('should not do anything', async () => {
      const {scroller, fixtureCleanup} = await virtualizerFixture(
        fixtureOptions
      );
      const {startPos, endPos, events, duration} = await observeScroll(
        scroller,
        () => scroller.scrollTo({[coordinate]: 0, behavior: 'smooth'})
      );
      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(0);
      expect(events.length).to.equal(0);
      expect(duration).to.equal(null);
      fixtureCleanup();
    });
  });

  describe('trying to instantly scroll to the current position', () => {
    it('should not do anything', async () => {
      const {scroller, fixtureCleanup} = await virtualizerFixture(
        fixtureOptions
      );
      const {startPos, endPos, events, duration} = await observeScroll(
        scroller,
        () => scroller.scrollTo({[coordinate]: 0})
      );
      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(0);
      expect(events.length).to.equal(0);
      expect(duration).to.equal(null);
      fixtureCleanup();
    });
  });
}

describe('basic scrolling functionality, via scrollTo()', () => {
  describe('vertical', () => {
    describe('using <lit-virtualizer>...', () => {
      describe('...and window scrolling', () => {
        testBasicScrolling({useDirective: false, scroller: false});
      });
      describe('...and virtualizer scrolling', () => {
        testBasicScrolling({useDirective: false, scroller: true});
      });
    });

    describe('using the virtualize() directive...', () => {
      describe('...and window scrolling', () => {
        testBasicScrolling({useDirective: true, scroller: false});
      });
      describe('...and virtualizer scrolling', () => {
        testBasicScrolling({useDirective: true, scroller: true});
      });
    });
  });

  describe('horizontal', () => {
    describe('using <lit-virtualizer>...', () => {
      describe('...and window scrolling', () => {
        testBasicScrolling({
          useDirective: false,
          scroller: false,
          layout: {direction: 'horizontal'},
        });
      });
      describe('...and virtualizer scrolling', () => {
        testBasicScrolling({
          useDirective: false,
          scroller: true,
          layout: {direction: 'horizontal'},
        });
      });
    });

    describe('using the virtualize() directive...', () => {
      describe('...and window scrolling', () => {
        testBasicScrolling({
          useDirective: true,
          scroller: false,
          layout: {direction: 'horizontal'},
        });
      });
      describe('...and virtualizer scrolling', () => {
        testBasicScrolling({
          useDirective: true,
          scroller: true,
          layout: {direction: 'horizontal'},
        });
      });
    });
  });
});

function testScrollBy(fixtureOptions: VirtualizerFixtureOptions) {
  ignoreBenignErrors(beforeEach, afterEach);

  const {coordinate, crossCoordinate} = getCoordinate(fixtureOptions);

  it('should work', async () => {
    const {scroller, fixtureCleanup} = await virtualizerFixture(fixtureOptions);
    let {startPos, endPos} = await observeScroll(scroller, () =>
      scroller.scrollBy({[coordinate]: 2000})
    );
    expect(startPos[coordinate]).to.equal(0);
    expect(startPos[crossCoordinate]).to.equal(0);
    expect(endPos[coordinate]).to.equal(2000);
    expect(endPos[crossCoordinate]).to.equal(0);
    ({startPos, endPos} = await observeScroll(scroller, () =>
      scroller.scrollBy({[coordinate]: -1000})
    ));
    expect(startPos[coordinate]).to.equal(2000);
    expect(endPos[coordinate]).to.equal(1000);
    fixtureCleanup();
  });
}

describe('scrollBy()', () => {
  testScrollBy({});
});
