/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../helpers.js';
import {html, css, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import '../../lit-virtualizer.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {expect, html as testingHtml, fixture} from '@open-wc/testing';
import {last} from '../helpers.js';

interface Item {
  text: string;
}
const data = new Array(1000).fill('').map((_, i) => ({text: `Item ${i}`}));

@customElement('slot-in-scroller')
class SlotInScroller extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        height: 100vh;
        overflow: hidden;
      }

      .child {
        display: block;
        height: 100%;
        overflow: scroll;
      }
    `,
  ];

  render() {
    return html` <div class="child"><slot></slot></div> `;
  }
}

@customElement('slot-is-scroller')
class SlotIsScroller extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        height: 100vh;
        overflow: hidden;
      }

      slot {
        display: block;
        height: 100%;
        overflow: scroll;
      }
    `,
  ];

  render() {
    return html` <slot></slot> `;
  }
}

@customElement('my-example')
export class MyExample extends LitElement {
  render() {
    return html`
      <lit-virtualizer
        .items=${data}
        .renderItem=${(item: Item) => html` <p>${item.text}</p> `}
      >
      </lit-virtualizer>
    `;
  }
}

async function tryScrolling(virtualizer: LitVirtualizer) {
  expect(virtualizer).to.be.instanceOf(LitVirtualizer);
  await customElements.whenDefined('lit-virtualizer');
  await virtualizer.layoutComplete;
  const lastChild: Element = last(Array.from(virtualizer.children));
  lastChild.scrollIntoView();
  await virtualizer.layoutComplete;
  const newLastChild = last(Array.from(virtualizer.children));
  expect(newLastChild).not.to.equal(lastChild);
}

describe('A slotted virtualizer scrolls correctly...', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  describe('...when it is directly slotted...', () => {
    it('...and the slot is in a scroller', async () => {
      const example = (await fixture(
        testingHtml`
          <slot-in-scroller>
            <lit-virtualizer
              .items=${data}
              .renderItem=${(item: Item) => html` <p>${item.text}</p> `}
            ></lit-virtualizer>
          </slot-in-scroller>
          <style>body {margin: 0; padding: 0;}</style>
        `
      )) as SlotInScroller;
      expect(example).to.be.instanceof(SlotInScroller);
      const virtualizer = example.querySelector('lit-virtualizer')!;
      await tryScrolling(virtualizer);
    });

    it('...or the slot itself is a scroller', async () => {
      const example = (await fixture(
        testingHtml`
          <slot-is-scroller>
            <lit-virtualizer
              .items=${data}
              .renderItem=${(item: Item) => html` <p>${item.text}</p> `}
            ></lit-virtualizer>
          </slot-is-scroller>
          <style>body {margin: 0; padding: 0;}</style>
        `
      )) as SlotIsScroller;
      expect(example).to.be.instanceof(SlotIsScroller);
      const virtualizer = example.querySelector('lit-virtualizer')!;
      await tryScrolling(virtualizer);
    });
  });

  describe('Also, when it is within a slotted parent element...', () => {
    it('...and the slot is in a scroller', async () => {
      const example = (await fixture(
        testingHtml`
          <slot-in-scroller>
            <my-example></my-example>
          </slot-in-scroller>
          <style>body {margin: 0; padding: 0;}</style>
        `
      )) as SlotInScroller;
      expect(example).to.be.instanceof(SlotInScroller);
      const parent = example.querySelector('my-example');
      const virtualizer = parent!.shadowRoot!.querySelector('lit-virtualizer')!;
      await tryScrolling(virtualizer);
    });

    it('...or the slot itself is a scroller', async () => {
      const example = (await fixture(
        testingHtml`
          <slot-is-scroller>
            <my-example></my-example>
          </slot-is-scroller>
          <style>body {margin: 0; padding: 0;}</style>
        `
      )) as SlotIsScroller;
      expect(example).to.be.instanceof(SlotIsScroller);
      const parent = example.querySelector('my-example');
      const virtualizer = parent!.shadowRoot!.querySelector('lit-virtualizer')!;
      await tryScrolling(virtualizer);
    });
  });
});
