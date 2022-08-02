/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors, isInViewport, justText, until} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {expect, html, fixture} from '@open-wc/testing';

describe('flow layout', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  let items: string[];
  let litVirtualizer: LitVirtualizer;

  beforeEach(async () => {
    items = [
      'zero',
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
    ];
    const example: HTMLDivElement = await fixture(html` <div>
      <style>
        lit-virtualizer {
          height: 200px;
          width: 200px;
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
        layout="flow"
        .items=${items}
        .renderItem=${(item: number) => html`<div class="item">${item}</div>`}
      ></lit-virtualizer>
    </div>`);
    litVirtualizer = example.querySelector('lit-virtualizer')!;
    expect(litVirtualizer).to.be.instanceOf(LitVirtualizer);

    // Wait for the rendering of at least one item to complete.
    await until(() => !!litVirtualizer.querySelector('.item'));
  });

  afterEach(() => {
    items = [];
    litVirtualizer = undefined as unknown as LitVirtualizer;
  });

  it('shows the correct items when scrolling to index', async () => {
    let allItems: Element[];
    let visibleItems: Element[];

    allItems = Array.from(litVirtualizer.querySelectorAll('.item'));
    expect(allItems.length).to.equal(items.length);

    await until(() => isInViewport(allItems[0]));

    visibleItems = Array.from(litVirtualizer.querySelectorAll('.item')).filter(
      (i) => isInViewport(i, litVirtualizer)
    );

    expect(visibleItems.length).to.equal(4);
    expect(justText(visibleItems[0].textContent?.trim())).to.equal('zero');
    expect(justText(visibleItems[3].textContent?.trim())).to.equal('three');

    litVirtualizer.scrollToIndex(5);

    // Assert that the total number of items in the has not changed.
    allItems = Array.from(litVirtualizer.querySelectorAll('.item'));
    expect(allItems.length).to.equal(items.length);

    await until(() => isInViewport(allItems[5], litVirtualizer));

    visibleItems = Array.from(litVirtualizer.querySelectorAll('.item')).filter(
      (i) => isInViewport(i, litVirtualizer)
    );

    expect(visibleItems.length).to.equal(4);
    expect(justText(visibleItems[0].textContent?.trim())).to.equal('five');
    expect(justText(visibleItems[3].textContent?.trim())).to.equal('eight');
  });
});
