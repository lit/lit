/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {array, ignoreBenignErrors} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {grid} from '../../layouts/grid.js';
import {styleMap} from 'lit/directives/style-map.js';
import {expect, html, fixture} from '@open-wc/testing';

interface NamedItem {
  name: string;
}

const _100Items = array(100).map((_, i) => ({name: `Item ${i}`}));

describe('Virtualizer behaves properly when it has a position: fixed ancestor', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  // Regression test for https://github.com/lit/lit/issues/3904
  it('should calculate its viewport correctly', async () => {
    // Our outer container is overflow: hidden, so would normally be
    // a "clipping ancestor" of our virtualizer. Since it has a
    // width of zero, it would cause the virtualizer to be invisible.
    const containerStyles = {
      overflow: 'hidden',
      width: '0',
    };

    // But since this scrolling element is position: fixed, it will
    // be positioned relative to the document, essentially "popping out"
    // of its zero-width parent. This means the virtualizer will be
    // visible and have some space to work with, after all.
    const scrollerStyles = {
      position: 'fixed',
      width: '200px',
      height: '200px',
    };

    // We use the grid layout here because it conveniently will not
    // render any items if it calculates that it doesn't have sufficient
    // space, making our testing job easier.
    const container = await fixture(html`
      <div id="container" style=${styleMap(containerStyles)}>
        <div id="scroller" style=${styleMap(scrollerStyles)}>
          <lit-virtualizer
            .layout=${grid({
              itemSize: '100px',
            })}
            .items=${_100Items}
            .renderItem=${({name}: NamedItem) => html`<div>${name}</div>`}
          ></lit-virtualizer>
        </div>
      </div>
    `);

    const scroller = container.querySelector('#scroller')!;
    expect(scroller).to.be.instanceOf(HTMLDivElement);
    const virtualizer = container.querySelector('lit-virtualizer')!;
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);

    // If virtualizer has properly ignored the zero-width ancestor of our
    // fixed-position scroller, some children will be rendered; otherwise, not.
    //
    // In practice, we'll time out if we fail here because the `layoutComplete`
    // promise will never be fulfilled.
    await virtualizer.layoutComplete;
    expect(virtualizer.textContent).to.contain('Item 0');
  });

  // Regression test for https://github.com/lit/lit/issues/4125
  it('should respond to scroll events from a fixed-position scroller', async () => {
    const containerStyles = {
      overflow: 'hidden',
    };

    // Our scroller is position: fixed. While its ancestors (if any) should
    // therefore be ignored for the purpose of calculating virtualizer's
    // viewport, the scroller itself should be considered a clipping ancestor,
    // and virtualizer should listen to any `scroll` events it emits.
    const scrollerStyles = {
      position: 'fixed',
      width: '200px',
      height: '200px',
      overflow: 'auto',
    };

    const container = await fixture(html`
      <div id="container" style=${styleMap(containerStyles)}>
        <div id="scroller" style=${styleMap(scrollerStyles)}>
          <lit-virtualizer
            .items=${_100Items}
            .renderItem=${({name}: NamedItem) => html`<p>${name}</p>`}
          ></lit-virtualizer>
        </div>
      </div>
    `);

    const scroller = container.querySelector('#scroller')!;
    expect(scroller).to.be.instanceOf(HTMLDivElement);
    const virtualizer = container.querySelector('lit-virtualizer')!;
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);

    await virtualizer.layoutComplete;
    expect(virtualizer.textContent).to.contain('Item 0');

    // If the position: fixed scroller has properly been recognized as
    // a clipping ancestor, then virtualizer will re-render as scrolling
    // occurs; otherwise, not.
    //
    // In practice, we'll time out if we fail here because the `layoutComplete`
    // promise will never be fulfilled.
    scroller.scrollTo(0, scroller.scrollHeight);
    await virtualizer.layoutComplete;
    expect(virtualizer.textContent).to.contain('Item 99');
  });
});
