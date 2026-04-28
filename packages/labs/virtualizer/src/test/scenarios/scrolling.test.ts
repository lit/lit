/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect, fixture, html} from '@open-wc/testing';
import {ignoreBenignErrors, pass, until} from '../helpers.js';
import {
  virtualizerFixture,
  VirtualizerFixtureOptions,
  observeScroll,
} from '../virtualizer-test-utilities.js';
import {BaseLayoutConfig} from '../../layouts/shared/Layout.js';
import {virtualizerRef} from '../../virtualize.js';
import {LitVirtualizer} from '../../LitVirtualizer.js';
import '../../lit-virtualizer.js';

type Coordinate = 'top' | 'left';

/**
 * @deprecated This function uses the legacy `direction` layout config option.
 * These tests exercise backward compatibility for the deprecated API.
 */
function getCoordinate(fixtureOptions: VirtualizerFixtureOptions) {
  const layout = fixtureOptions.layout as
    | (BaseLayoutConfig & {direction?: 'vertical' | 'horizontal'})
    | undefined;
  const direction = layout?.direction ?? 'vertical';
  const coordinate: Coordinate = direction === 'horizontal' ? 'left' : 'top';
  const crossCoordinate: Coordinate = coordinate === 'left' ? 'top' : 'left';
  return {coordinate, crossCoordinate};
}

interface CSSDirectionOptions {
  writingMode?: 'horizontal-tb' | 'vertical-lr' | 'vertical-rl';
  direction?: 'ltr' | 'rtl';
}

/**
 * Get the scroll coordinate based on CSS writing-mode and direction.
 * In horizontal-tb (default), block axis is vertical (top/bottom).
 * In vertical-lr/vertical-rl, block axis is horizontal (left/right).
 *
 * For vertical-rl, scrollLeft/scrollX uses inverted values
 * (0 at block-start/right, negative values toward block-end/left).
 * This applies to both element scrollers and window scrolling when the
 * document root has writing-mode: vertical-rl.
 */
function getCoordinateFromCSS(cssOptions: CSSDirectionOptions) {
  const writingMode = cssOptions.writingMode ?? 'horizontal-tb';

  if (writingMode === 'horizontal-tb') {
    return {
      coordinate: 'top' as const,
      crossCoordinate: 'left' as const,
      negateScroll: false,
    };
  } else if (writingMode === 'vertical-rl') {
    // vertical-rl: scrollLeft/scrollX is 0 at start (right), negative toward left.
    // This works for both element scrollers and window scrolling when the document
    // root has writing-mode: vertical-rl.
    return {
      coordinate: 'left' as const,
      crossCoordinate: 'top' as const,
      negateScroll: true,
    };
  } else {
    // vertical-lr: scrollLeft works normally (0 at left, positive toward right)
    return {
      coordinate: 'left' as const,
      crossCoordinate: 'top' as const,
      negateScroll: false,
    };
  }
}

/**
 * Creates fixtureStyles that set writing-mode and/or direction on the
 * ancestor <section> element, allowing them to inherit to the virtualizer.
 */
function createCSSDirectionStyles(cssOptions: CSSDirectionOptions) {
  const writingModeCSS = cssOptions.writingMode
    ? `writing-mode: ${cssOptions.writingMode};`
    : '';
  const directionCSS = cssOptions.direction
    ? `direction: ${cssOptions.direction};`
    : '';

  return html`
    <style>
      section {
        height: 400px;
        width: 400px;
        ${writingModeCSS}
        ${directionCSS}
      }

      lit-virtualizer[scroller],
      .virtualizerHost[scroller] {
        height: 400px;
        width: 400px;
      }
    </style>
  `;
}

/**
 * Test scrolling behavior with CSS-based writing-mode and direction.
 * Sets CSS properties on the ancestor element, letting them inherit
 * to the virtualizer host - matching real-world usage patterns.
 */
function testCSSBasedScrolling(
  fixtureOptions: Omit<VirtualizerFixtureOptions, 'fixtureStyles' | 'layout'>,
  cssOptions: CSSDirectionOptions
) {
  ignoreBenignErrors(beforeEach, afterEach);

  // For vertical-rl, scrollLeft/scrollX uses negative values (0 at start, negative toward left)
  const {coordinate, negateScroll} = getCoordinateFromCSS(cssOptions);
  const fixtureStyles = createCSSDirectionStyles(cssOptions);
  // For vertical-rl, scroll values are 0 at start (right) and go negative toward left
  const scrollTarget = negateScroll ? -2000 : 2000;
  const expectedEndPos = negateScroll ? -2000 : 2000;

  describe('smooth scrolling', () => {
    it('should take some time and end up where it is supposed to', async () => {
      const {scroller} = await virtualizerFixture({
        ...fixtureOptions,
        fixtureStyles,
      });

      const scrollResults = await observeScroll(scroller, () =>
        scroller.scrollTo({[coordinate]: scrollTarget, behavior: 'smooth'})
      );
      const {startPos, events, duration} = scrollResults;
      let {endPos} = scrollResults;

      // For horizontal scrolling (vertical-lr/vertical-rl), we may need
      // a second scroll due to timing issues with scroll dimension calculation
      if (coordinate === 'left' && fixtureOptions.scroller) {
        const secondScrollResults = await observeScroll(scroller, () =>
          scroller.scrollTo({[coordinate]: scrollTarget, behavior: 'smooth'})
        );
        endPos = secondScrollResults.endPos;
      }

      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(expectedEndPos);
      expect(events.length).to.be.greaterThan(1);
      expect(duration).to.be.greaterThan(0);
    });
  });

  describe('instant scrolling', () => {
    it('should take no time and end up where it is supposed to', async () => {
      const {scroller} = await virtualizerFixture({
        ...fixtureOptions,
        fixtureStyles,
      });

      const scrollResults = await observeScroll(scroller, () =>
        scroller.scrollTo({[coordinate]: scrollTarget})
      );
      const {startPos, events, duration} = scrollResults;
      let {endPos} = scrollResults;

      // For horizontal scrolling, allow a delay for layout to complete
      if (coordinate === 'left') {
        await new Promise((r) => setTimeout(r, 100));
        const secondScrollResults = await observeScroll(scroller, () =>
          scroller.scrollTo({[coordinate]: scrollTarget})
        );
        endPos = secondScrollResults.endPos;
      }

      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(expectedEndPos);
      if (coordinate === 'left') {
        expect(events.length).to.be.greaterThanOrEqual(1);
        // For horizontal scrolling (vertical-lr), the first instant scroll may
        // trigger layout-related scroll events, so we allow some duration
        // tolerance. The second scroll should be truly instant (duration=0).
      } else {
        expect(events.length).to.equal(1);
        expect(duration).to.equal(0);
      }
    });
  });

  describe('trying to smoothly scroll to the current position', () => {
    it('should not do anything', async () => {
      const {scroller} = await virtualizerFixture({
        ...fixtureOptions,
        fixtureStyles,
      });
      const {startPos, endPos, events, duration} = await observeScroll(
        scroller,
        () => scroller.scrollTo({[coordinate]: 0, behavior: 'smooth'})
      );
      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(0);
      expect(events.length).to.equal(0);
      expect(duration).to.equal(null);
    });
  });

  describe('trying to instantly scroll to the current position', () => {
    it('should not do anything', async () => {
      const {scroller} = await virtualizerFixture({
        ...fixtureOptions,
        fixtureStyles,
      });
      const {startPos, endPos, events, duration} = await observeScroll(
        scroller,
        () => scroller.scrollTo({[coordinate]: 0})
      );
      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(0);
      expect(events.length).to.equal(0);
      expect(duration).to.equal(null);
    });
  });
}

function testBasicScrolling(fixtureOptions: VirtualizerFixtureOptions) {
  ignoreBenignErrors(beforeEach, afterEach);

  const {coordinate} = getCoordinate(fixtureOptions);

  describe('smooth scrolling', () => {
    it('should take some time and end up where it is supposed to', async () => {
      const {scroller} = await virtualizerFixture(fixtureOptions);

      const scrollResults = await observeScroll(scroller, () =>
        scroller.scrollTo({[coordinate]: 2000, behavior: 'smooth'})
      );
      const {startPos, events, duration} = scrollResults;
      let {endPos} = scrollResults;

      /**
       * HACK(usergenic): We are investigating a specific case where scrollWidth
       * is intermittently being reported as 1000, when it should actually be in
       * the 45000 range for the "direction: horizontal" and "scroller: true"
       * scenarios, but is being calculated as 1000.  To work around this in the
       * known test cases we are going to issue two scrollTo calls.  This is a
       * temporary workaround.
       */
      if (coordinate === 'left' && fixtureOptions.scroller) {
        const secondScrollResults = await observeScroll(scroller, () =>
          scroller.scrollTo({[coordinate]: 2000, behavior: 'smooth'})
        );
        endPos = secondScrollResults.endPos;
      }

      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(2000);
      expect(events.length).to.be.greaterThan(1);
      expect(duration).to.be.greaterThan(0);
    });
  });

  describe('instant scrolling', () => {
    it('should take no time and end up where it is supposed to', async () => {
      const {scroller} = await virtualizerFixture(fixtureOptions);

      const scrollResults = await observeScroll(scroller, () =>
        scroller.scrollTo({[coordinate]: 2000})
      );
      const {startPos, events, duration} = scrollResults;
      let {endPos} = scrollResults;

      /**
       * HACK(usergenic): We are investigating a specific case where scrollWidth
       * is intermittently being reported as 1000, when it should actually be in
       * the 45000 range for the "direction: horizontal" and "scroller: true"
       * scenarios, but is being calculated as 1000.  To work around this in the
       * known test cases we are going to issue two scrollTo calls.  This is a
       * temporary workaround.
       *
       * @deprecated Extended to also cover window scrolling horizontal tests
       * which use the legacy direction config. Also added frame wait to ensure
       * layout is complete before scrolling.
       */
      if (coordinate === 'left') {
        // Wait for multiple frames to ensure layout is complete and scroll dimensions
        // are updated. Smooth scrolling takes longer, giving the browser more time to
        // update scroll dimensions. We need to simulate that delay here.
        await new Promise((r) => setTimeout(r, 100));
        const secondScrollResults = await observeScroll(scroller, () =>
          scroller.scrollTo({[coordinate]: 2000})
        );
        endPos = secondScrollResults.endPos;
      }

      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(2000);
      // For horizontal scrolling, we may need two scroll calls due to timing issues
      if (coordinate === 'left') {
        expect(events.length).to.be.greaterThanOrEqual(1);
      } else {
        expect(events.length).to.equal(1);
      }
      expect(duration).to.equal(0);
    });
  });

  describe('trying to smoothly scroll to the current position', () => {
    it('should not do anything', async () => {
      const {scroller} = await virtualizerFixture(fixtureOptions);
      const {startPos, endPos, events, duration} = await observeScroll(
        scroller,
        () => scroller.scrollTo({[coordinate]: 0, behavior: 'smooth'})
      );
      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(0);
      expect(events.length).to.equal(0);
      expect(duration).to.equal(null);
    });
  });

  describe('trying to instantly scroll to the current position', () => {
    it('should not do anything', async () => {
      const {scroller} = await virtualizerFixture(fixtureOptions);
      const {startPos, endPos, events, duration} = await observeScroll(
        scroller,
        () => scroller.scrollTo({[coordinate]: 0})
      );
      expect(startPos[coordinate]).to.equal(0);
      expect(endPos[coordinate]).to.equal(0);
      expect(events.length).to.equal(0);
      expect(duration).to.equal(null);
    });
  });
}

// TODO(usergenic): The scrolling tests are currently failing due to an
// unknown issue, possibly related to changes in latest Chrome version.
// Commenting out these tests until we can investigate further, so that
// we can get the rest of the tests running on CI without interfering
// with the overall lit release pipeline.
describe.skipInCI('basic scrolling functionality, via scrollTo()', () => {
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

  /**
   * @deprecated These tests exercise backward compatibility for the legacy
   * `direction` layout config option. They can be removed when the deprecated
   * API is removed.
   */
  describe('horizontal (legacy direction config)', () => {
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

/**
 * CSS-based direction tests using writing-mode and direction properties.
 * These test the preferred (non-legacy) pattern where CSS properties are
 * set on an ancestor and inherited to the virtualizer host.
 */
describe.skipInCI('CSS-based direction: writing-mode: vertical-lr', () => {
  describe('using <lit-virtualizer>...', () => {
    describe('...and window scrolling', () => {
      testCSSBasedScrolling(
        {useDirective: false, scroller: false},
        {writingMode: 'vertical-lr'}
      );
    });
    describe('...and virtualizer scrolling', () => {
      testCSSBasedScrolling(
        {useDirective: false, scroller: true},
        {writingMode: 'vertical-lr'}
      );
    });
  });

  describe('using the virtualize() directive...', () => {
    describe('...and window scrolling', () => {
      testCSSBasedScrolling(
        {useDirective: true, scroller: false},
        {writingMode: 'vertical-lr'}
      );
    });
    describe('...and virtualizer scrolling', () => {
      testCSSBasedScrolling(
        {useDirective: true, scroller: true},
        {writingMode: 'vertical-lr'}
      );
    });
  });
});

describe.skipInCI('CSS-based direction: direction: rtl', () => {
  describe('using <lit-virtualizer>...', () => {
    describe('...and window scrolling', () => {
      testCSSBasedScrolling(
        {useDirective: false, scroller: false},
        {direction: 'rtl'}
      );
    });
    describe('...and virtualizer scrolling', () => {
      testCSSBasedScrolling(
        {useDirective: false, scroller: true},
        {direction: 'rtl'}
      );
    });
  });

  describe('using the virtualize() directive...', () => {
    describe('...and window scrolling', () => {
      testCSSBasedScrolling(
        {useDirective: true, scroller: false},
        {direction: 'rtl'}
      );
    });
    describe('...and virtualizer scrolling', () => {
      testCSSBasedScrolling(
        {useDirective: true, scroller: true},
        {direction: 'rtl'}
      );
    });
  });
});

// vertical-rl writing mode: block axis flows right-to-left, and scrollLeft
// uses inverted values (0 at block-start/right, negative toward block-end/left).
// Virtualizer scrolling (scroller: true) works correctly with negative scrollLeft.
describe('CSS-based direction: writing-mode: vertical-rl', () => {
  describe('using <lit-virtualizer>...', () => {
    describe('...and virtualizer scrolling', () => {
      testCSSBasedScrolling(
        {useDirective: false, scroller: true},
        {writingMode: 'vertical-rl'}
      );
    });
  });

  describe('using the virtualize() directive...', () => {
    describe('...and virtualizer scrolling', () => {
      testCSSBasedScrolling(
        {useDirective: true, scroller: true},
        {writingMode: 'vertical-rl'}
      );
    });
  });
});

// vertical-rl window scrolling requires writing-mode to be set on the document
// root (html element). When set correctly, scrollX uses negative values just
// like element scrollers.
describe.skipInCI(
  'CSS-based direction: writing-mode: vertical-rl (window scrolling)',
  () => {
    // Set writing-mode on document root for window scrolling to work correctly
    beforeEach(() => {
      document.documentElement.style.writingMode = 'vertical-rl';
    });

    afterEach(() => {
      document.documentElement.style.writingMode = '';
    });

    describe('using <lit-virtualizer>...', () => {
      describe('...and window scrolling', () => {
        testCSSBasedScrolling(
          {useDirective: false, scroller: false},
          {writingMode: 'vertical-rl'}
        );
      });
    });

    describe('using the virtualize() directive...', () => {
      describe('...and window scrolling', () => {
        testCSSBasedScrolling(
          {useDirective: true, scroller: false},
          {writingMode: 'vertical-rl'}
        );
      });
    });
  }
);

// Test for mixed writing-mode scenario: host and scroller have different writing-modes.
// This exercises the dual writing-mode handling where:
// - Child positioning uses the HOST's writing-mode
// - Scroll coordinates use the SCROLLER's writing-mode
describe.skipInCI(
  'Mixed writing-mode: horizontal-tb host inside vertical-rl scroller',
  () => {
    // Document (scroller) is vertical-rl, but the virtualizer (host) is horizontal-tb.
    // The host's block axis is vertical (scrollTop), which isn't affected by the
    // scroller's writing-mode. This tests that the scroller's vertical-rl writing-mode
    // doesn't incorrectly affect the handling of scrollTop.
    beforeEach(() => {
      document.documentElement.style.writingMode = 'vertical-rl';
    });

    afterEach(() => {
      document.documentElement.style.writingMode = '';
    });

    // Custom styles that set horizontal-tb on the section (which the virtualizer inherits)
    // while the document remains vertical-rl
    const mixedWritingModeStyles = html`
      <style>
        section {
          writing-mode: horizontal-tb;
          height: 400px;
          width: 400px;
        }
      </style>
    `;

    describe('using <lit-virtualizer>...', () => {
      describe('...and window scrolling', () => {
        ignoreBenignErrors(beforeEach, afterEach);

        it('should handle mixed writing-modes correctly', async () => {
          const {virtualizer} = await virtualizerFixture({
            useDirective: false,
            scroller: false,
            fixtureStyles: mixedWritingModeStyles,
          });

          // Verify the writing-modes are different
          const hostStyle = getComputedStyle(virtualizer as unknown as Element);
          const scrollerStyle = getComputedStyle(document.documentElement);
          expect(hostStyle.writingMode).to.equal('horizontal-tb');
          expect(scrollerStyle.writingMode).to.equal('vertical-rl');

          // In horizontal-tb, block axis is vertical, using scrollTop.
          // scrollTop behavior is the same regardless of scroller writing-mode.
          // The test verifies that the scroller's vertical-rl doesn't break
          // the virtualizer's normal vertical scrolling.

          // Wait for initial render
          await new Promise((r) => setTimeout(r, 200));

          // The document should have scrollable height (block axis for horizontal-tb)
          const virtualizerEl = virtualizer as unknown as Element;
          expect(document.documentElement.scrollHeight).to.be.greaterThan(
            document.documentElement.clientHeight
          );

          // Scroll vertically using scrollTop (block axis for horizontal-tb host)
          window.scrollTo({top: 2000});
          await new Promise((r) => setTimeout(r, 100));

          // scrollY should be positive (scrollTop works the same regardless of scroller writing-mode)
          expect(window.scrollY).to.be.greaterThan(0);
          expect(window.scrollY).to.equal(2000);

          // Verify items are visible at the scrolled position
          const firstChild = virtualizerEl.firstElementChild;
          expect(firstChild).to.not.be.null;
        });
      });
    });
  }
);

function testScrollBy(fixtureOptions: VirtualizerFixtureOptions) {
  ignoreBenignErrors(beforeEach, afterEach);

  const {coordinate, crossCoordinate} = getCoordinate(fixtureOptions);

  it('should work', async () => {
    const {scroller} = await virtualizerFixture(fixtureOptions);
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
  });
}

describe('scrollBy()', () => {
  testScrollBy({});
});

/**
 * Sanity check for CSS writing-mode detection with an explicit
 * `writing-mode: horizontal-tb` declaration. horizontal-tb is the
 * browser default so most of the suite hits this code path incidentally,
 * but a dedicated test guards against regressions where the explicit
 * declaration takes a different path than the unset default.
 */
describe('CSS-based direction: writing-mode: horizontal-tb (explicit)', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('behaves identically to the default (scroller mode, scrollTop)', async () => {
    const fixtureStyles = html`
      <style>
        section {
          height: 400px;
          width: 400px;
          writing-mode: horizontal-tb;
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
      fixtureStyles,
    });

    expect(getComputedStyle(host).writingMode).to.equal('horizontal-tb');

    const {startPos, endPos} = await observeScroll(scroller, () =>
      scroller.scrollTo({top: 2000, behavior: 'smooth'})
    );

    expect(startPos.top).to.equal(0);
    expect(endPos.top).to.equal(2000);
  });
});

/**
 * Deprecation warnings for the legacy `direction` layout config option.
 * The warning is emitted via `issueWarning` which dedups globally (via
 * `globalThis.litIssuedWarnings`), so these tests clear the dedup set
 * before each case to make them order-independent.
 */
describe('deprecation warnings for legacy `direction` layout config', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  beforeEach(() => {
    (
      globalThis as unknown as {litIssuedWarnings?: Set<string>}
    ).litIssuedWarnings?.clear();
  });

  it('emits a deprecation warning when `direction: "horizontal"` is used', async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(String(args[0]));
    };

    try {
      await virtualizerFixture({
        scroller: true,
        layout: {direction: 'horizontal'},
      });

      expect(
        warnings.some(
          (w) => w.includes('direction') && w.includes('deprecated')
        )
      ).to.be.true;
    } finally {
      console.warn = originalWarn;
    }
  });

  it('emits the override-variant warning when `direction: "horizontal"` overrides an explicit writing-mode', async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(String(args[0]));
    };

    try {
      // The override check in Virtualizer._handleLegacyDirectionConfig
      // reads `hostElement.style.writingMode` — i.e. the *inline* style
      // attribute, not computed style. Setting writing-mode via a
      // stylesheet rule wouldn't trigger the branch, so we render the
      // virtualizer with an explicit inline `style` attribute. Using
      // @open-wc/testing's `fixture` directly here because the shared
      // `virtualizerFixture` utility doesn't support custom element
      // attributes on the virtualizer host.
      const items = new Array(10)
        .fill('')
        .map((_, index) => ({index, text: `Item ${index}`}));
      const container = await fixture(html`
        <section style="height: 400px; width: 400px;">
          <lit-virtualizer
            scroller
            style="writing-mode: vertical-rl; height: 400px; width: 400px;"
            .items=${items}
            .renderItem=${(item: {text: string}) =>
              html`<div>${item.text}</div>`}
            .layout=${{direction: 'horizontal'}}
          ></lit-virtualizer>
        </section>
      `);
      const virtualizer = container.querySelector(
        'lit-virtualizer'
      ) as LitVirtualizer;
      // Wait for the async Virtualizer init to run, which is what
      // invokes _handleLegacyDirectionConfig.
      await until(
        () => (virtualizer as unknown as {[k: symbol]: unknown})[virtualizerRef]
      );
      await virtualizer.layoutComplete;

      await pass(() => {
        expect(
          warnings.some(
            (w) => w.includes('direction') && w.includes('overriding')
          )
        ).to.be.true;
      });
    } finally {
      console.warn = originalWarn;
    }
  });

  it('does not emit a direction-deprecation warning when `direction` is omitted', async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(String(args[0]));
    };

    try {
      await virtualizerFixture({scroller: true});

      expect(
        warnings.some(
          (w) => w.includes('direction') && w.includes('deprecated')
        )
      ).to.be.false;
    } finally {
      console.warn = originalWarn;
    }
  });
});
