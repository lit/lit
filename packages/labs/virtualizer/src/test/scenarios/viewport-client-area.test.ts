/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect, fixture, html} from '@open-wc/testing';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {grid} from '../../layouts/grid.js';
import {array, ignoreBenignErrors, pass} from '../helpers.js';

describe('Virtualizer client viewport', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  for (const border of [0, 6]) {
    it(`fits a grid inside a scroller with a ${border}px border`, async () => {
      const virtualizer = await fixture<LitVirtualizer>(html`
        <lit-virtualizer
          scroller
          style="width: 320px; height: 200px; box-sizing: border-box;
            border: ${border}px solid; scrollbar-gutter: stable;"
          .layout=${grid({itemSize: '64px', gap: '0px'})}
          .items=${array(100)}
          .renderItem=${(item: number) => html`<div class="item">${item}</div>`}
        ></lit-virtualizer>
      `);
      expect(virtualizer).to.be.instanceOf(LitVirtualizer);
      await virtualizer.layoutComplete;
      await pass(() => {
        expect(virtualizer.querySelectorAll('.item').length).to.be.greaterThan(
          0
        );
        expect(virtualizer.scrollWidth).to.be.at.most(virtualizer.clientWidth);
      });

      virtualizer.style.width = '260px';
      await pass(() =>
        expect(virtualizer.scrollWidth).to.be.at.most(virtualizer.clientWidth)
      );
      virtualizer.scrollTop = virtualizer.scrollHeight;
      await pass(() => expect(virtualizer.textContent).to.contain('99'));
    });
  }

  it('clips a wider host to an ancestor client area', async () => {
    const scroller = await fixture<HTMLDivElement>(html`
      <div
        style="width: 320px; height: 200px; overflow: auto;
        border: 6px solid; box-sizing: border-box; scrollbar-gutter: stable;"
      >
        <lit-virtualizer
          style="width: 600px;"
          .layout=${grid({itemSize: '64px', gap: '0px'})}
          .items=${array(100)}
          .renderItem=${(item: number) => html`<div class="item">${item}</div>`}
        ></lit-virtualizer>
      </div>
    `);
    const virtualizer =
      scroller.querySelector<LitVirtualizer>('lit-virtualizer')!;
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);
    await virtualizer.layoutComplete;
    await pass(() => {
      const right =
        scroller.getBoundingClientRect().left +
        scroller.clientLeft +
        scroller.clientWidth;
      const items = virtualizer.querySelectorAll('.item');
      expect(items.length).to.be.greaterThan(0);
      for (const item of items) {
        expect(item.getBoundingClientRect().right).to.be.at.most(right + 1);
      }
    });
  });
});
