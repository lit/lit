/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  _resetWritingModeConformanceForTesting,
  _setWritingModeConformanceForTesting,
  computeEffectiveWritingMode,
  isWritingModeConforming,
  readDirection,
  readWritingMode,
  setLogicalMinSize,
} from '../../utils/writing-mode.js';
import {expect} from '@open-wc/testing';

type StyleProps = {
  writingMode?: string | undefined;
  direction?: string | undefined;
};

function fakeElementWithComputedStyle(props: StyleProps): Element {
  // Build a real Element + a stub `getComputedStyle` proxy so the readers
  // exercise the same control flow they use in production.
  const el = document.createElement('div');
  const fakeStyle = {} as Record<string, unknown>;
  if ('writingMode' in props) {
    fakeStyle.writingMode = props.writingMode;
  }
  if ('direction' in props) {
    fakeStyle.direction = props.direction;
  }
  // Patch getComputedStyle for this element only.
  const original = window.getComputedStyle;
  window.getComputedStyle = ((target: Element, ...rest: unknown[]) =>
    target === el
      ? fakeStyle
      : (original as unknown as Function).call(
          window,
          target,
          ...rest
        )) as typeof window.getComputedStyle;
  // Restore on next microtask so individual asserts can stack within a test.
  queueMicrotask(() => {
    window.getComputedStyle = original;
  });
  return el;
}

describe('readWritingMode', () => {
  it('passes through canonical values', () => {
    for (const value of [
      'horizontal-tb',
      'vertical-lr',
      'vertical-rl',
    ] as const) {
      const el = fakeElementWithComputedStyle({writingMode: value});
      expect(readWritingMode(el)).to.equal(value);
    }
  });

  it('normalizes empty string to horizontal-tb', () => {
    const el = fakeElementWithComputedStyle({writingMode: ''});
    expect(readWritingMode(el)).to.equal('horizontal-tb');
  });

  it('normalizes a missing property to horizontal-tb', () => {
    // Property is absent from the computed-style object entirely.
    const el = fakeElementWithComputedStyle({});
    expect(readWritingMode(el)).to.equal('horizontal-tb');
  });

  it('normalizes undefined to horizontal-tb', () => {
    const el = fakeElementWithComputedStyle({writingMode: undefined});
    expect(readWritingMode(el)).to.equal('horizontal-tb');
  });

  it('normalizes unrecognized strings to horizontal-tb', () => {
    const el = fakeElementWithComputedStyle({writingMode: 'sideways-lr'});
    expect(readWritingMode(el)).to.equal('horizontal-tb');
  });

  it('reads real CSS writing-mode from a live element', () => {
    const el = document.createElement('div');
    el.style.writingMode = 'vertical-lr';
    document.body.appendChild(el);
    try {
      expect(readWritingMode(el)).to.equal('vertical-lr');
    } finally {
      el.remove();
    }
  });
});

describe('readDirection', () => {
  it('passes through canonical values', () => {
    for (const value of ['ltr', 'rtl'] as const) {
      const el = fakeElementWithComputedStyle({direction: value});
      expect(readDirection(el)).to.equal(value);
    }
  });

  it('normalizes empty string to ltr', () => {
    const el = fakeElementWithComputedStyle({direction: ''});
    expect(readDirection(el)).to.equal('ltr');
  });

  it('normalizes a missing property to ltr', () => {
    const el = fakeElementWithComputedStyle({});
    expect(readDirection(el)).to.equal('ltr');
  });

  it('normalizes undefined to ltr', () => {
    const el = fakeElementWithComputedStyle({direction: undefined});
    expect(readDirection(el)).to.equal('ltr');
  });

  it('normalizes unrecognized strings to ltr', () => {
    const el = fakeElementWithComputedStyle({direction: 'auto'});
    expect(readDirection(el)).to.equal('ltr');
  });

  it('reads real CSS direction from a live element', () => {
    const el = document.createElement('div');
    el.style.direction = 'rtl';
    document.body.appendChild(el);
    try {
      expect(readDirection(el)).to.equal('rtl');
    } finally {
      el.remove();
    }
  });
});

describe('computeEffectiveWritingMode', () => {
  it('returns the context writing-mode unchanged for axis="block"', () => {
    expect(
      computeEffectiveWritingMode('block', 'horizontal-tb', 'ltr')
    ).to.equal('horizontal-tb');
    expect(
      computeEffectiveWritingMode('block', 'horizontal-tb', 'rtl')
    ).to.equal('horizontal-tb');
    expect(computeEffectiveWritingMode('block', 'vertical-lr', 'ltr')).to.equal(
      'vertical-lr'
    );
    expect(computeEffectiveWritingMode('block', 'vertical-rl', 'ltr')).to.equal(
      'vertical-rl'
    );
  });

  it('swaps to vertical-lr for inline + horizontal-tb + ltr', () => {
    expect(
      computeEffectiveWritingMode('inline', 'horizontal-tb', 'ltr')
    ).to.equal('vertical-lr');
  });

  it('swaps to vertical-rl for inline + horizontal-tb + rtl', () => {
    expect(
      computeEffectiveWritingMode('inline', 'horizontal-tb', 'rtl')
    ).to.equal('vertical-rl');
  });

  it('swaps to horizontal-tb for inline + vertical-lr (ltr or rtl)', () => {
    expect(
      computeEffectiveWritingMode('inline', 'vertical-lr', 'ltr')
    ).to.equal('horizontal-tb');
    expect(
      computeEffectiveWritingMode('inline', 'vertical-lr', 'rtl')
    ).to.equal('horizontal-tb');
  });

  it('swaps to horizontal-tb for inline + vertical-rl (ltr or rtl)', () => {
    expect(
      computeEffectiveWritingMode('inline', 'vertical-rl', 'ltr')
    ).to.equal('horizontal-tb');
    expect(
      computeEffectiveWritingMode('inline', 'vertical-rl', 'rtl')
    ).to.equal('horizontal-tb');
  });
});

describe('isWritingModeConforming', () => {
  beforeEach(() => {
    _resetWritingModeConformanceForTesting();
  });
  afterEach(() => {
    _resetWritingModeConformanceForTesting();
  });

  it('reports the host engine as conforming', () => {
    // The test runner is Chrome, which honors writing-mode.
    expect(isWritingModeConforming()).to.equal(true);
  });

  it('caches the result on subsequent calls', () => {
    const first = isWritingModeConforming();
    // Force a different cached value to confirm it isn't re-probing.
    _setWritingModeConformanceForTesting(!first);
    expect(isWritingModeConforming()).to.equal(!first);
  });

  it('returns optimistic true and does not cache when document.body is missing', () => {
    const realBody = document.body;
    Object.defineProperty(document, 'body', {
      configurable: true,
      get: () => null,
    });
    try {
      expect(isWritingModeConforming()).to.equal(true);
    } finally {
      Object.defineProperty(document, 'body', {
        configurable: true,
        value: realBody,
        writable: true,
      });
    }
    // No cache was written, so a real probe should still run on next call.
    const probed = isWritingModeConforming();
    expect(probed).to.equal(true);
  });
});

describe('setLogicalMinSize', () => {
  let el: HTMLElement;
  beforeEach(() => {
    el = document.createElement('div');
  });

  it('writes logical properties on conforming engines', () => {
    setLogicalMinSize(el, '200px', '100px', 'horizontal-tb', true);
    expect(el.style.minBlockSize).to.equal('200px');
    expect(el.style.minInlineSize).to.equal('100px');
    expect(el.style.minHeight).to.equal('');
    expect(el.style.minWidth).to.equal('');
  });

  it('translates logical → physical on non-conforming horizontal-tb', () => {
    setLogicalMinSize(el, '200px', '100px', 'horizontal-tb', false);
    expect(el.style.minHeight).to.equal('200px');
    expect(el.style.minWidth).to.equal('100px');
    expect(el.style.minBlockSize).to.equal('');
    expect(el.style.minInlineSize).to.equal('');
  });

  it('translates logical → physical on non-conforming vertical-lr', () => {
    setLogicalMinSize(el, '200px', '100px', 'vertical-lr', false);
    expect(el.style.minWidth).to.equal('200px');
    expect(el.style.minHeight).to.equal('100px');
    expect(el.style.minBlockSize).to.equal('');
    expect(el.style.minInlineSize).to.equal('');
  });

  it('translates logical → physical on non-conforming vertical-rl', () => {
    setLogicalMinSize(el, '200px', '100px', 'vertical-rl', false);
    expect(el.style.minWidth).to.equal('200px');
    expect(el.style.minHeight).to.equal('100px');
    expect(el.style.minBlockSize).to.equal('');
    expect(el.style.minInlineSize).to.equal('');
  });

  it('clears stale logical properties when switching to non-conforming', () => {
    el.style.minBlockSize = '50px';
    el.style.minInlineSize = '40px';
    setLogicalMinSize(el, '200px', '100px', 'horizontal-tb', false);
    expect(el.style.minBlockSize).to.equal('');
    expect(el.style.minInlineSize).to.equal('');
    expect(el.style.minHeight).to.equal('200px');
    expect(el.style.minWidth).to.equal('100px');
  });
});
