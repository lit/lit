/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {array, ignoreBenignErrors} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {nothing} from 'lit';
import {expect, html, fixture} from '@open-wc/testing';

describe('Virtualizer re-renders properly after changes to the `items` array', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('should not produce an out-of-bounds error when the number of items is reduced', async () => {
    interface NamedItem {
      name: string;
    }

    const _100Items = array(100).map((_, i) => ({name: `Item ${i}`}));
    const _50Things = array(50).map((_, i) => ({name: `Thing ${i}`}));

    /**
     * This is a repro case for
     * https://github.com/PolymerLabs/uni-virtualizer/issues/111, included
     * here to guard against regressions.
     *
     * The danger in this area of the code is that the `virtualize`
     * directive sometimes renders its children as part of the standard
     * directive update lifecycle (as opposed to Virtualizer's own update
     * lifecycle), and in this case bad things can happen if the
     * directive's cached representation of the Virtualizer's current
     * range (the indices of the first and last items currently rendered
     * to the DOM) has somehow gotten out of sync with the actual size
     * of the `items` array.
     *
     * The (implied) contract of Virtualizer's `renderItem()` function
     * is that the `item` argument will never be undefined, so a check
     * like the one below should be unnecessary in application code; we
     * do it here purely for test purposes. We track our own state and
     * guard against an actual runtime error because `renderItem()` runs
     * in an event handler and an error thrown in that context would not
     * cause our test to fail.
     */
    let outOfBounds = false;
    function renderItem(item: NamedItem) {
      if (item === undefined) {
        outOfBounds = true;
        return nothing;
      }
      return html`<p>${item.name}</p>`;
    }

    const v = (await fixture(html`
      <lit-virtualizer
        scroller
        .items=${_100Items}
        .renderItem=${renderItem}
      ></lit-virtualizer>
    `)) as LitVirtualizer;

    // Make sure we have a Virtualizer and
    // that its initial render is correct
    expect(v).to.be.instanceOf(LitVirtualizer);
    await v.layoutComplete;
    expect(v.textContent).to.contain('Item 0');

    // Scroll all the way to the bottom and
    // confirm the last item is in the DOM
    v.scrollBy(0, 100000);
    await v.layoutComplete;
    expect(v.textContent).to.contain('Item 99');

    // Replace the `items` array with one
    // only half as long
    v.items = _50Things;
    await v.layoutComplete;
    // Make sure we've correctly re-rendered
    // and that the new last item is in the DOM
    expect(v.textContent).to.contain('Thing 49');
    // If outOfBounds is true, then the directive's
    // state has gotten out of sync (i.e., it has
    // tried to render an item whose index is
    // outside the bounds of the newly set `items`
    // array).
    expect(outOfBounds).to.be.false;
  });
});
