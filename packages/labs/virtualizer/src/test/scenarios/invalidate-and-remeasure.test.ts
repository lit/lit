/**
 * @license
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

  async function createVirtualizer() {
    const container = await fixture(
      html` <div>
        <style>
          .viewport {
            height: 200px;
            width: 200px;
            margin: 0;
            padding: 0;
            overflow: auto;
          }
          lit-virtualizer {
            display: block;
            position: relative;
          }
          .item {
            width: 200px;
            height: 50px;
            margin: 0;
            padding: 0;
          }
          .tall .item {
            height: 150px;
          }
        </style>
        <div class="viewport">
          <lit-virtualizer
            .items=${array(200)}
            .renderItem=${(item: number) =>
              html`<div class="item">${item}</div>`}
          ></lit-virtualizer>
        </div>
      </div>`
    );
    const virtualizer = (await until(() =>
      container.querySelector('lit-virtualizer')
    )) as LitVirtualizer;
    // Value usage of LitVirtualizer: importing the registration module is
    // what declares the <lit-virtualizer> element.
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);
    const controller = await until(
      () => (virtualizer as VirtualizerHostElement)[virtualizerRef]!
    );
    expect(controller).to.be.instanceOf(Virtualizer);
    return {container, virtualizer, controller};
  }

  function metricsCache(controller: Virtualizer) {
    const layout = (controller as unknown as {_layout: FlowLayout})._layout!;
    return layout._metricsCache as {
      getChildSize(index: number): number | undefined;
    };
  }

  it('recomputes sizes cached for items that left the rendered range', async () => {
    const {container, virtualizer, controller} = await createVirtualizer();

    // Measure a window far below, then return to the top so items around
    // 100 leave the rendered range with their sizes still in the cache.
    const viewport = virtualizer.parentElement as HTMLElement;
    await pass(() =>
      expect(metricsCache(controller).getChildSize(0)).to.equal(50)
    );
    viewport.scrollTop = 5000;
    await pass(() =>
      expect(metricsCache(controller).getChildSize(100)).to.equal(50)
    );
    viewport.scrollTop = 0;
    await pass(() => expect(viewport.scrollTop).to.equal(0));
    await virtualizer.layoutComplete;

    // Items grow while offscreen: nothing observes items 100 and up, so
    // their cached 50px sizes are stale after this.
    container.classList.add('tall');

    controller.invalidateAndRemeasure();

    // With the stale cache cleared, the scroll size reflects the real
    // 200 * 150 total.
    await pass(() => expect(virtualizer.style.minHeight).to.equal('30000px'));
  });
});
