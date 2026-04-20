/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {array, ignoreBenignErrors, pass} from '../helpers.js';
import {LitElement, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {expect, html, fixture} from '@open-wc/testing';
import {grid} from '../../layouts/grid.js';
import {virtualizerFixture} from '../virtualizer-test-utilities.js';

describe('Properly sizing virtualizer within host element', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  @customElement('custom-element-containing-lit-virtualizer')
  class CustomElementContainingLitVirtualizer extends LitElement {
    static styles = css`
      :host {
        display: block;
        position: absolute;
        box-sizing: border-box;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        padding: 50px;
      }
      lit-virtualizer {
        display: block;
        position: absolute;
      }
      .item {
        display: block;
        position: absolute;
      }
    `;

    @property({type: Array})
    items = [];

    render() {
      return html`
        <lit-virtualizer
          .layout=${grid({
            itemSize: {width: '25px', height: '25px'},
            gap: '0px',
            flex: false,
          })}
          .items=${this.items}
          .renderItem=${(item: number) => html`
            <div class="item">[${item}]</div>
          `}
        >
        </lit-virtualizer>
      `;
    }
  }

  it('should size the virtualizer width to the host element', async () => {
    const items = array(100);
    const root = await fixture(html`
      <div class="root">
        <style>
          .container {
            display: block;
            position: absolute;
            width: 200px;
            box-sizing: border-box;
          }
        </style>
        <div class="container">
          <custom-element-containing-lit-virtualizer .items=${items}>
          </custom-element-containing-lit-virtualizer>
        </div>
      </div>
    `);

    await pass(() =>
      expect(
        root.querySelector('custom-element-containing-lit-virtualizer')
      ).to.be.instanceOf(CustomElementContainingLitVirtualizer)
    );
    const ceclv = root.querySelector(
      'custom-element-containing-lit-virtualizer'
    )!;
    await pass(() =>
      expect(
        ceclv.shadowRoot?.querySelector('lit-virtualizer')
      ).to.be.instanceOf(LitVirtualizer)
    );
    const litVirtualizer = ceclv.shadowRoot!.querySelector(
      'lit-virtualizer'
    )! as unknown as HTMLElement;
    await pass(() => expect(litVirtualizer.textContent).to.contain('[4]'));

    const renderedItems = [...litVirtualizer.querySelectorAll('.item')];
    const rects = renderedItems.map((i) => i.getBoundingClientRect());

    const ceclvRect = ceclv.getBoundingClientRect();
    const leftOffset = ceclvRect.left;

    expect(window.getComputedStyle(ceclv).width).to.equal('200px');
    expect(rects[0].left - leftOffset).to.equal(50);
    expect(rects[1].left - leftOffset).to.equal(75);
    expect(rects[2].left - leftOffset).to.equal(100);
    expect(rects[3].left - leftOffset).to.equal(125);

    /**
     * Prior to fix in #3400, the following assertion would fail because
     * virtualizer would have not considered its bounding box properly
     * and positioned item 4 outside at 150px instead of expected 50px.
     */
    expect(rects[4].left - leftOffset).to.equal(50);
  });

  // Regression test for https://github.com/lit/lit/issues/4080
  it('should resize host when total item size changes', async () => {
    const items = array(5);
    const root = await fixture(html`
      <div class="root">
        <style>
          .container {
            display: block;
            position: absolute;
            width: 200px;
            box-sizing: border-box;
          }
        </style>
        <div class="container">
          <custom-element-containing-lit-virtualizer .items=${items}>
          </custom-element-containing-lit-virtualizer>
        </div>
      </div>
    `);

    await pass(() =>
      expect(
        root.querySelector('custom-element-containing-lit-virtualizer')
      ).to.be.instanceOf(CustomElementContainingLitVirtualizer)
    );
    const ceclv = root.querySelector<CustomElementContainingLitVirtualizer>(
      'custom-element-containing-lit-virtualizer'
    )!;
    await pass(() =>
      expect(
        ceclv.shadowRoot?.querySelector('lit-virtualizer')
      ).to.be.instanceOf(LitVirtualizer)
    );
    const litVirtualizer =
      ceclv.shadowRoot!.querySelector<LitVirtualizer>('lit-virtualizer')!;

    // Should be:
    // [0] [1] [2] [3]
    // [4]
    await pass(() => {
      expect(litVirtualizer.textContent).to.contain('[4]');
      expect(window.getComputedStyle(litVirtualizer).height).to.equal('50px');
    });

    ceclv.items = ceclv.items.slice(0, ceclv.items.length - 1);

    // Now should be:
    // [0] [1] [2] [3]
    await pass(() => {
      expect(litVirtualizer.textContent).not.to.contain('[4]');
      expect(window.getComputedStyle(litVirtualizer).height).to.equal('25px');
    });
  });
});

/**
 * A scroller-mode virtualizer with no explicit size would previously collapse
 * silently (the old behavior set `min-block-size: 150px`, which this PR
 * removes). The replacement behavior is a console warning emitted via
 * `InstanceWarnings.warnOn('zero-size', ...)` so developers see the issue
 * during integration without the virtualizer lying about its size.
 */
describe('zero-size scroller warning', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('fires when a scroller-mode virtualizer has zero size', async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(String(args[0]));
    };

    try {
      // Override the default fixture styles so the scroller has zero block-size.
      const fixtureStyles = html`
        <style>
          section {
            height: 400px;
            width: 400px;
          }
          lit-virtualizer[scroller] {
            block-size: 0;
            inline-size: 400px;
          }
        </style>
      `;

      await virtualizerFixture({
        scroller: true,
        fixtureStyles,
      });

      await pass(() => {
        expect(warnings.some((w) => w.includes('zero-size'))).to.be.true;
      });
    } finally {
      console.warn = originalWarn;
    }
  });

  it('does not fire in non-scroller (window-scrolling) mode', async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(String(args[0]));
    };

    try {
      // Non-scroller virtualizers get a 1px min-size bootstrap from
      // `_applyVirtualizerStyles`, so they never legitimately hit zero —
      // and the warning is deliberately scoped to scroller mode only.
      await virtualizerFixture({scroller: false});

      expect(warnings.some((w) => w.includes('zero-size'))).to.be.false;
    } finally {
      console.warn = originalWarn;
    }
  });

  it('does not fire when a scroller-mode virtualizer has non-zero size', async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(String(args[0]));
    };

    try {
      // Default fixture styles size the scroller to 400x400.
      await virtualizerFixture({scroller: true});

      expect(warnings.some((w) => w.includes('zero-size'))).to.be.false;
    } finally {
      console.warn = originalWarn;
    }
  });
});
