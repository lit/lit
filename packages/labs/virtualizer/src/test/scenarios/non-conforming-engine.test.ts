/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect, html} from '@open-wc/testing';
import {ignoreBenignErrors} from '../helpers.js';
import {virtualizerFixture} from '../virtualizer-test-utilities.js';
import {
  _resetWritingModeConformanceForTesting,
  _setWritingModeConformanceForTesting,
} from '../../utils/writing-mode.js';

/**
 * Simulates an engine that:
 *   - omits `writingMode` and `direction` from `getComputedStyle()` results,
 *   - silently accepts inline-style writes for `writing-mode` but does
 *     not apply them to layout, and
 *   - does not honor logical CSS sizing (`min-block-size` /
 *     `min-inline-size`).
 *
 * In this regime the virtualizer must still produce correct layouts for
 * `axis: 'block'` and `axis: 'inline'` by sourcing internal coordinate
 * logic from `_effectiveWritingMode` and translating its sizing writes
 * to physical (`min-width` / `min-height`) properties.
 */
function installNonConformingHarness() {
  const realGetComputedStyle = window.getComputedStyle;
  const wrappedGetComputedStyle = ((
    target: Element,
    pseudo?: string | null
  ): CSSStyleDeclaration => {
    const real = realGetComputedStyle.call(window, target, pseudo);
    // Access real on the original (preserves CSSStyleDeclaration's internal
    // slots), then override only the two properties we care about.
    return new Proxy(real, {
      get(t, prop) {
        if (prop === 'writingMode' || prop === 'direction') {
          return undefined;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (t as any)[prop];
        return typeof value === 'function' ? value.bind(t) : value;
      },
    });
  }) as typeof window.getComputedStyle;
  window.getComputedStyle = wrappedGetComputedStyle;
  _setWritingModeConformanceForTesting(false);
  return () => {
    window.getComputedStyle = realGetComputedStyle;
    _resetWritingModeConformanceForTesting();
  };
}

describe('non-conforming-engine simulation', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  let restoreHarness: (() => void) | null = null;

  beforeEach(() => {
    restoreHarness = installNonConformingHarness();
  });

  afterEach(() => {
    restoreHarness?.();
    restoreHarness = null;
  });

  describe('the harness', () => {
    it('hides writingMode and direction from getComputedStyle', () => {
      const probe = document.createElement('div');
      probe.style.writingMode = 'vertical-lr';
      document.body.appendChild(probe);
      try {
        expect(getComputedStyle(probe).writingMode).to.equal(undefined);
        expect(getComputedStyle(probe).direction).to.equal(undefined);
        // Other CSSStyleDeclaration access still works.
        expect(getComputedStyle(probe).display).to.equal('block');
        expect(getComputedStyle(probe).marginBlockStart).to.be.a('string');
      } finally {
        probe.remove();
      }
    });
  });

  describe('axis="block" (default)', () => {
    it('renders a populated, correctly-sized scroller', async () => {
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

      const {host} = await virtualizerFixture({
        useDirective: false,
        scroller: true,
        fixtureStyles,
        nItems: 50,
      });

      const rect = host.getBoundingClientRect();
      expect(rect.height).to.equal(400);
      expect(rect.width).to.equal(400);

      // Children should be rendered (range is non-empty).
      expect(host.children.length).to.be.greaterThan(0);
    });

    it('translates logical min-size writes to physical on the host', async () => {
      const fixtureStyles = html`
        <style>
          section {
            height: 400px;
            width: 400px;
          }
        </style>
      `;

      // Non-scroller mode is where _sizeHostElement applies logical
      // min-sizes, so use scroller=false here.
      const {host} = await virtualizerFixture({
        useDirective: false,
        scroller: false,
        fixtureStyles,
        nItems: 50,
      });

      // On non-conforming engines the virtualizer should write
      // min-height (block axis for horizontal-tb), not min-block-size.
      expect(host.style.minBlockSize).to.equal('');
      expect(host.style.minInlineSize).to.equal('');
      expect(host.style.minHeight).to.not.equal('');
    });
  });

  describe('axis="inline"', () => {
    it('renders a populated scroller with inline-axis sizing', async () => {
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

      const {host} = await virtualizerFixture({
        useDirective: false,
        scroller: true,
        axis: 'inline',
        fixtureStyles,
        nItems: 50,
      });

      // Even though the engine doesn't honor `writing-mode`, internal
      // coordinate logic should treat the host as if it were vertical-lr.
      // The host's bounding rect should still match its physical CSS sizing.
      const rect = host.getBoundingClientRect();
      expect(rect.height).to.equal(400);
      expect(rect.width).to.equal(400);
      expect(host.children.length).to.be.greaterThan(0);
    });
  });
});
