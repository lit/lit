/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {readDirection, readWritingMode} from '../../utils/writing-mode.js';
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
