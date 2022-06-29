/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors, until} from '../helpers.js';
import {expect} from '@esm-bundle/chai';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {virtualize, VirtualizeDirectiveConfig} from '../../virtualize.js';
import {flow} from '../../layouts/flow.js';
import {html, render} from 'lit';

describe('smoke test', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  describe('<lit-virtualizer>', function () {
    it('registers lit-virtualizer as a custom element', function () {
      const lvs = document.createElement('lit-virtualizer');
      expect(lvs).to.be.instanceOf(LitVirtualizer);
    });
  });

  describe('virtualize', function () {
    let container: HTMLElement;

    beforeEach(function () {
      container = document.createElement('div');
      container.className = 'container';
      document.body.appendChild(container);
    });

    afterEach(function () {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    });

    it('uses the provided method to render items', async function () {
      const example = html`
        ${virtualize({
          items: ['foo', 'bar', 'baz'] as Array<string>,
          renderItem: (item: string) => html`<p>${item}</p>`,
          layout: flow(),
        })}
      `;

      render(example, container);
      await until(() => container.innerHTML.includes('baz'));

      expect(container.innerHTML).to.include('foo');
      expect(container.innerHTML).to.include('bar');
      expect(container.innerHTML).to.include('baz');

      // must remove child _before_ end of spec. TODO @straversi: find a way
      // to move into afterEach.
      document.body.removeChild(container);
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
      // TODO(usergenic) Disabled because flaky, see https://github.com/lit/lit/issues/3099.
      it.skip('emits visibilityChanged events with the proper indices', async function () {
        container.style.height = '100px';
        container.style.minHeight = '100px';

        const directive = virtualize({
          scroller: true,
          items: ['foo', 'bar', 'baz', 'qux', 'bux'] as Array<string>,
          renderItem: (item: string) =>
            html`<div style="height: 50px">${item}</div>`,
          layout: flow(),
        } as VirtualizeDirectiveConfig<string>);

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

        document.body.removeChild(container);
      });
    });
  });
});
