/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect} from '@open-wc/testing';
import {ignoreBenignErrors, last} from '../helpers.js';
import {
  virtualizerFixture,
  DefaultItem,
} from '../virtualizer-test-utilities.js';

describe('keyFunction', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  describe('<lit-virtualizer>', () => {
    it('maintains item-element correspondence with no user-provided keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture();
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
    it('maintains item-element correspondence with an item-based keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture({
        keyFunction: (item: DefaultItem, _idx) => item.index,
      });
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
    it('maintains item-element correspondence with an index-based keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture({
        keyFunction: (_item, idx) => idx,
      });
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
  });

  describe('virtualize() directive', () => {
    it('maintains item-element correspondence with no user-provided keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture({
        useDirective: true,
      });
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
    it('maintains item-element correspondence with an item-based keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture({
        useDirective: true,
        keyFunction: (item: DefaultItem, _idx) => item.index,
      });
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
    it('maintains item-element correspondence with an index-based keyFunction', async () => {
      const {inspector, host, virtualizer} = await virtualizerFixture({
        useDirective: true,
        keyFunction: (_item, idx) => idx,
      });
      const refEl = last(inspector.childElements);
      const origText = refEl.textContent;
      host.scrollTo({top: 2000});
      await virtualizer.layoutComplete;
      expect(refEl.textContent).to.equal(origText);
    });
  });
});
