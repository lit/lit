/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../helpers.js';
import {virtualizerFixture} from '../virtualizer-test-utilities.js';
import {expect} from '@open-wc/testing';

/**
 * Spies on every `ResizeObserver` instance created while installed, tracking
 * which elements are currently observed by any of them. Restores the
 * original methods on `teardown()`.
 */
function spyOnResizeObserver() {
  const observedElements = new Set<Element>();
  const originalObserve = ResizeObserver.prototype.observe;
  const originalUnobserve = ResizeObserver.prototype.unobserve;

  ResizeObserver.prototype.observe = function (
    this: ResizeObserver,
    target: Element,
    options?: ResizeObserverOptions
  ) {
    observedElements.add(target);
    return originalObserve.call(this, target, options);
  };
  ResizeObserver.prototype.unobserve = function (
    this: ResizeObserver,
    target: Element
  ) {
    observedElements.delete(target);
    return originalUnobserve.call(this, target);
  };

  return {
    observedElements,
    teardown() {
      ResizeObserver.prototype.observe = originalObserve;
      ResizeObserver.prototype.unobserve = originalUnobserve;
    },
  };
}

/**
 * The actual rendered row elements, excluding Virtualizer's internal
 * `virtualizer-sizer` element (which `_hostElementRO`, a *different*
 * `ResizeObserver` used for the host itself, legitimately keeps observing
 * for the virtualizer's whole lifetime).
 */
function renderedRowElements(host: Element): Element[] {
  return Array.from(host.querySelectorAll(':not([virtualizer-sizer])'));
}

describe('Virtualizer does not leak children via ResizeObserver', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('unobserves children once they leave the rendered range', async () => {
    const {observedElements, teardown} = spyOnResizeObserver();

    try {
      const {host, controller, scroller} = await virtualizerFixture({
        nItems: 200,
      });

      const initialRows = renderedRowElements(host);
      expect(initialRows.length).to.be.greaterThan(0);
      for (const row of initialRows) {
        expect(observedElements.has(row)).to.equal(true);
      }

      // Scroll far enough that none of the initially-rendered items remain
      // in the rendered range.
      scroller.scrollTo({top: 100000});
      await controller.layoutComplete;

      for (const row of initialRows) {
        expect(observedElements.has(row)).to.equal(false);
      }
    } finally {
      teardown();
    }
  });

  it('unobserves all children when the rendered range becomes empty', async () => {
    const {observedElements, teardown} = spyOnResizeObserver();

    try {
      const {host, controller} = await virtualizerFixture({nItems: 50});

      const initialRows = renderedRowElements(host);
      expect(initialRows.length).to.be.greaterThan(0);
      for (const row of initialRows) {
        expect(observedElements.has(row)).to.equal(true);
      }

      host.style.display = 'none';
      await controller.layoutComplete;

      for (const row of initialRows) {
        expect(observedElements.has(row)).to.equal(false);
      }
    } finally {
      teardown();
    }
  });
});
