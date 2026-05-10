/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors, pass} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import '../../lit-virtualizer.js';
import {expect, fixture, html} from '@open-wc/testing';

/**
 * Tests for the string aliases of the `scroller` config property:
 *   `'self'`     ↔ `true`
 *   `'ancestor'` ↔ `false`
 *   `'managed'`  (no boolean equivalent)
 *
 * Boolean values remain supported for backwards compatibility; the
 * string forms are the preferred surface in new code.
 */
describe('scroller config: string aliases', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('treats `scroller="self"` as equivalent to `scroller=true` (host becomes a scroller)', async () => {
    const items = Array.from({length: 100}, (_, i) => i);
    const virtualizer = (await fixture(
      html`<lit-virtualizer
        style="block-size: 200px; inline-size: 200px;"
        .scroller=${'self'}
        .items=${items}
        .renderItem=${(i: number) =>
          html`<div style="block-size: 50px;">${i}</div>`}
      ></lit-virtualizer>`
    )) as LitVirtualizer;

    // Self-scroller mode applies `overflow: auto` to the host via
    // `_applyVirtualizerStyles()`. This is the most direct user-visible
    // signal that self-mode took effect.
    expect(getComputedStyle(virtualizer).overflow).to.equal('auto');

    // Verify rendering happened.
    await pass(() =>
      expect(virtualizer.querySelector('div')?.textContent).to.equal('0')
    );
  });

  it('treats `scroller="ancestor"` as equivalent to the default (host does not become a scroller)', async () => {
    const items = Array.from({length: 100}, (_, i) => i);
    const virtualizer = (await fixture(
      html`<lit-virtualizer
        style="block-size: 200px; inline-size: 200px;"
        .scroller=${'ancestor'}
        .items=${items}
        .renderItem=${(i: number) => html`<div>${i}</div>`}
      ></lit-virtualizer>`
    )) as LitVirtualizer;

    // Ancestor mode does NOT apply `overflow: auto` to the host —
    // it sets bootstrap min sizes instead.
    expect(getComputedStyle(virtualizer).overflow).to.equal('visible');
  });

  it('parses `scroller` as a string attribute (e.g. scroller="self")', async () => {
    const items = Array.from({length: 100}, (_, i) => i);
    const virtualizer = (await fixture(
      html`<lit-virtualizer
        scroller="self"
        style="block-size: 200px; inline-size: 200px;"
        .items=${items}
        .renderItem=${(i: number) => html`<div>${i}</div>`}
      ></lit-virtualizer>`
    )) as LitVirtualizer;

    // Property reflects the string value.
    expect(virtualizer.scroller).to.equal('self');
    // CSS effect of self-scroller mode.
    expect(getComputedStyle(virtualizer).overflow).to.equal('auto');
  });

  it('parses bare `scroller` attribute as boolean true (legacy behavior preserved)', async () => {
    const items = Array.from({length: 100}, (_, i) => i);
    const virtualizer = (await fixture(
      html`<lit-virtualizer
        scroller
        style="block-size: 200px; inline-size: 200px;"
        .items=${items}
        .renderItem=${(i: number) => html`<div>${i}</div>`}
      ></lit-virtualizer>`
    )) as LitVirtualizer;

    // The property setter sees `true`, not 'self' — preserving legacy
    // semantics. Either form drives self-scroller mode the same way.
    expect(virtualizer.scroller).to.equal(true);
    expect(getComputedStyle(virtualizer).overflow).to.equal('auto');
  });
});
