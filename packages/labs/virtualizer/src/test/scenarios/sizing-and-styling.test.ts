/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {array, ignoreBenignErrors, until} from '../helpers.js';
import {LitElement, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {expect, html, fixture} from '@open-wc/testing';
import {grid} from '../../layouts/grid.js';

describe('Properly sizing virtualizer within host element', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  @customElement('custom-element-containing-lit-virtualizer')
  class CustomElementContainingLitVirtualizer extends LitElement {
    static styles = css`
      :host {
        display: block;
        position: absolute;
        box-sizing: border-box;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        padding: 50px;
      }
      lit-virtualizer {
        display: block;
        position: absolute;
      }
      .item {
        display: block;
        position: absolute;
      }
    `;

    @property({type: Array})
    items = [];

    render() {
      return html`
        <lit-virtualizer
          .layout=${grid({
            itemSize: {width: '25px', height: '25px'},
            gap: '0px',
            flex: false,
          })}
          .items=${this.items}
          .renderItem=${(item: number) => html`
            <div class="item">[${item}]</div>
          `}
        >
        </lit-virtualizer>
      `;
    }
  }

  it('should size the virtualizer width to the host element', async () => {
    const items = array(100);
    const root = await fixture(html`
      <div class="root">
        <style>
          .container {
            display: block;
            position: absolute;
            width: 200px;
            box-sizing: border-box;
          }
        </style>
        <div class="container">
          <custom-element-containing-lit-virtualizer .items=${items}>
          </custom-element-containing-lit-virtualizer>
        </div>
      </div>
    `);

    await until(
      () =>
        root.querySelector(
          'custom-element-containing-lit-virtualizer'
        ) instanceof CustomElementContainingLitVirtualizer
    );
    const ceclv = root.querySelector(
      'custom-element-containing-lit-virtualizer'
    )!;
    await until(
      () =>
        ceclv.shadowRoot?.querySelector('lit-virtualizer') instanceof
        LitVirtualizer
    );
    const litVirtualizer = ceclv.shadowRoot!.querySelector(
      'lit-virtualizer'
    )! as unknown as HTMLElement;
    await until(() => litVirtualizer.textContent?.includes('[4]'));

    const renderedItems = [...litVirtualizer.querySelectorAll('.item')];
    const rects = renderedItems.map((i) => i.getBoundingClientRect());

    const ceclvRect = ceclv.getBoundingClientRect();
    const leftOffset = ceclvRect.left;

    expect(window.getComputedStyle(ceclv).width).to.equal('200px');
    expect(rects[0].left - leftOffset).to.equal(50);
    expect(rects[1].left - leftOffset).to.equal(75);
    expect(rects[2].left - leftOffset).to.equal(100);
    expect(rects[3].left - leftOffset).to.equal(125);

    /**
     * Prior to fix in #3400, the following assertion would fail because
     * virtualizer would have not considered its bounding box properly
     * and positioned item 4 outside at 150px instead of expected 50px.
     */
    expect(rects[4].left - leftOffset).to.equal(50);
  });
});
