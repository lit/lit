/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {array, ignoreBenignErrors, pass, until} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {
  Virtualizer,
  VirtualizerHostElement,
  virtualizerRef,
} from '../../Virtualizer.js';
import {FlowLayout} from '../../layouts/flow.js';
import {expect, html, fixture} from '@open-wc/testing';

describe('invalidateAndRemeasure', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  function metricsCache(virtualizer: Virtualizer) {
    const layout = (virtualizer as unknown as {_layout: FlowLayout})._layout!;
    return layout._metricsCache as {
      getChildSize(index: number): number | undefined;
    };
  }

  it('clears cached child sizes and re-measures current children', async () => {
    const container = await fixture(html`
      <div>
        <style>
          lit-virtualizer {
            height: 200px;
            width: 200px;
            margin: 0;
            padding: 0;
          }
          .item {
            width: 200px;
            height: 50px;
            margin: 0;
            padding: 0;
          }
        </style>
        <lit-virtualizer
          scroller
          .items=${array(100)}
          .renderItem=${(item: number) => html`<div class="item">${item}</div>`}
        ></lit-virtualizer>
      </div>
    `);
    const virtualizer = (await until(() =>
      container.querySelector('lit-virtualizer')
    )) as LitVirtualizer<number>;
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);
    const controller = await until(
      () => (virtualizer as VirtualizerHostElement)[virtualizerRef]!
    );
    expect(controller).to.be.instanceOf(Virtualizer);

    await pass(() =>
      expect(metricsCache(controller).getChildSize(0)).to.equal(50)
    );

    // Resize the rendered children so the test can tell fresh measurements
    // (100px) from stale cached sizes (50px) after invalidation. Rendered
    // children are re-measured by the ResizeObserver on their own — what
    // nothing observes is the cached size of an index that has left the
    // rendered range, which is what the cache invalidation clears.
    for (const item of virtualizer.renderRoot.querySelectorAll<HTMLElement>(
      '.item'
    )) {
      item.style.height = '100px';
    }

    controller.invalidateAndRemeasure();

    expect(metricsCache(controller).getChildSize(0)).to.equal(undefined);
    await pass(() =>
      expect(metricsCache(controller).getChildSize(0)).to.equal(100)
    );
  });
});
