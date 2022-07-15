/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors, justText, until} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {render} from 'lit';
import {virtualize} from '../../virtualize.js';
import {expect, fixture, html} from '@open-wc/testing';

describe('smoke test', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  describe('<lit-virtualizer>', function () {
    it('registers lit-virtualizer as a custom element', async () => {
      const items = [1, 2, 3];
      const lvs = await fixture(html`
        <lit-virtualizer
          .items=${items}
          .renderItem=${(i: number) => html`<span>number ${i}</span>`}
        ></lit-virtualizer>
      `);
      expect(lvs).to.be.instanceOf(LitVirtualizer);

      await until(() => justText(lvs.innerHTML).includes('number 3'));

      expect(justText(lvs.innerHTML)).to.include('number 1');
      expect(justText(lvs.innerHTML)).to.include('number 2');
      expect(justText(lvs.innerHTML)).to.include('number 3');
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

      await until(() => example.innerHTML.includes('baz'));

      expect(example.innerHTML).to.include('foo');
      expect(example.innerHTML).to.include('bar');
      expect(example.innerHTML).to.include('baz');
    });

    // TODO (graynorton): We no longer have an explicit `useShadowDOM`
    // API, but we should write some tests to cover the new (automatic)
    // behavior of using a shadow root iff native Shadow DOM is available

    // describe('useShadowDOM', function() {
    //   it('renders to shadow DOM when useShadowDOM is true', async function() {
    //     const example = html`
    //       ${scroll({
    //         items: ['foo', 'bar', 'baz'],
    //         renderItem: (item) => html`<p>${item}</p>`,
    //         useShadowDOM: true
    //       })}
    //     `;

    //     render(example, container);

    //     await (new Promise(resolve => requestAnimationFrame(resolve)));
    //     assert.exists(container.shadowRoot);

    //     document.body.removeChild(container);
    //   });

    //   it('does not render to shadow DOM when useShadowDOM is false', async function() {
    //     const example = html`
    //       ${scroll({
    //         items: ['foo', 'bar', 'baz'],
    //         renderItem: (item) => html`<p>${item}</p>`,
    //         useShadowDOM: false
    //       })}
    //     `;

    //     render(example, container);

    //     await (new Promise(resolve => requestAnimationFrame(resolve)));
    //     assert.notExists(container.shadowRoot);

    //     document.body.removeChild(container);
    //   });
    // })

    describe('visible indices', function () {
      let container: HTMLElement;

      this.beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
      });

      this.afterEach(() => {
        document.body.removeChild(container);
      });

      it('emits visibilityChanged events with the proper indices', async function () {
        container.style.height = '100px';
        container.style.minHeight = '100px';

        const directive = virtualize({
          scroller: true,
          items: ['foo', 'bar', 'baz', 'qux', 'bux'] as Array<string>,
          renderItem: (item: string) =>
            html`<div style="height: 50px">${item}</div>`,
        });

        let firstVisible: Number = -1;
        let lastVisible: Number = -1;

        container.addEventListener('visibilityChanged', (e) => {
          firstVisible = e.first;
          lastVisible = e.last;
        });

        render(directive, container);
        await until(() => lastVisible === 1);
        expect(firstVisible).to.eq(0);
        expect(lastVisible).to.eq(1);

        container.scrollTop = 50;
        await until(() => lastVisible === 2);
        expect(firstVisible).to.eq(1);
        expect(lastVisible).to.eq(2);

        container.scrollTop += 1;
        await until(() => lastVisible === 3);
        expect(firstVisible).to.eq(1);
        expect(lastVisible).to.eq(3);
      });
    });
  });
});
