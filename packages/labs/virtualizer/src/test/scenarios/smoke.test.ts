/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors, pass} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {virtualize} from '../../virtualize.js';
import {expect, fixture, html} from '@open-wc/testing';

describe('smoke test', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  describe('<lit-virtualizer>', function () {
    it('registers lit-virtualizer as a custom element', async () => {
      const lvs = document.createElement('lit-virtualizer');
      expect(lvs).to.be.instanceOf(LitVirtualizer);
    });

    it('renders its items in light DOM', async () => {
      const items = [1, 2, 3];
      const lvs = await fixture(html`
        <lit-virtualizer
          .items=${items}
          .renderItem=${(i: number) => html`<span>number ${i}</span>`}
        ></lit-virtualizer>
      `);

      await pass(() => expect(lvs.textContent).to.contain('number 3'));

      expect(lvs.textContent).to.include('number 1');
      expect(lvs.textContent).to.include('number 2');
      expect(lvs.textContent).to.include('number 3');
    });
  });

  describe('virtualize', function () {
    it('uses the provided method to render items', async function () {
      const example = await fixture(html`
        <div>
          ${virtualize({
            items: ['foo', 'bar', 'baz'],
            renderItem: (item: string) => html`<p>${item}</p>`,
          })}
        </div>
      `);

      await pass(() => expect(example.innerHTML).to.contain('baz'));

      expect(example.innerHTML).to.include('foo');
      expect(example.innerHTML).to.include('bar');
      expect(example.innerHTML).to.include('baz');
    });
  });
});
