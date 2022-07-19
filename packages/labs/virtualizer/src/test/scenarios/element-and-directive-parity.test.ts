/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {eventually, ignoreBenignErrors, justText, until} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {virtualize} from '../../virtualize.js';
import {css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {expect, html, fixture} from '@open-wc/testing';

abstract class TestElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 200px;
    }
  `;

  @property({type: Object, attribute: false})
  public selected: Set<number> = new Set();

  @property({type: Array, attribute: false})
  public items: Array<number> = [];
}

@customElement('using-lit-virtualizer')
class UsingLitVirtualizer extends TestElement {
  render() {
    return html` <lit-virtualizer
      scroller
      .items=${this.items}
      .renderItem=${(n: number) =>
        html`<div>${n}${this.selected.has(n) ? ' selected' : ''}</div>`}
    ></lit-virtualizer>`;
  }
}

@customElement('using-virtualize-directive')
class UsingVirtualizeDirective extends TestElement {
  render() {
    return html` <div>
      ${virtualize({
        scroller: true,
        items: this.items,
        renderItem: (n) =>
          html`<div>${n}${this.selected.has(n) ? ' selected' : ''}</div>`,
      })}
    </div>`;
  }
}

describe('test fixture classes', () => {
  it('are registered as custom elements', () => {
    expect(customElements.get('this-is-not-a-custom-element')).to.be.undefined;
    expect(customElements.get('lit-virtualizer')).to.eq(LitVirtualizer);
    expect(customElements.get('using-lit-virtualizer')).to.eq(
      UsingLitVirtualizer
    );
    expect(customElements.get('using-virtualize-directive')).to.eq(
      UsingVirtualizeDirective
    );
  });
});

describe('lit-virtualizer and virtualize directive', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('both render changes based on non-item data changes', async () => {
    const items: Array<number> = Array.from(Array(100).keys());
    const selected = new Set([2, 5]);

    const example = await fixture(html`
      <div>
        <using-lit-virtualizer></using-lit-virtualizer>
        <using-virtualize-directive></using-virtualize-directive>
      </div>
    `);
    await until(
      () =>
        example.querySelector('using-lit-virtualizer') instanceof
        UsingLitVirtualizer
    );
    await until(
      () =>
        example.querySelector('using-virtualize-directive') instanceof
        UsingVirtualizeDirective
    );

    const ulv: UsingLitVirtualizer = example.querySelector(
      'using-lit-virtualizer'
    )!;
    ulv.items = items;
    ulv.selected = selected;
    expect(
      await eventually(() =>
        justText(ulv.shadowRoot?.innerHTML).includes('2 selected')
      )
    ).to.be.true;
    expect(justText(ulv.shadowRoot?.innerHTML)).includes('5 selected');

    const uvd: UsingVirtualizeDirective = example.querySelector(
      'using-virtualize-directive'
    )!;
    uvd.items = items;
    uvd.selected = selected;
    expect(
      await eventually(() =>
        justText(uvd.shadowRoot?.innerHTML).includes('2 selected')
      )
    ).to.be.true;
    expect(justText(uvd.shadowRoot?.innerHTML)).includes('5 selected');

    const newSelected = new Set([1, 3]);

    ulv.selected = newSelected;
    expect(
      await eventually(() =>
        justText(ulv.shadowRoot?.innerHTML).includes('1 selected')
      )
    ).to.be.true;
    expect(justText(ulv.shadowRoot!.innerHTML)).to.include('3 selected');
    expect(justText(ulv.shadowRoot!.innerHTML)).not.to.include('2 selected');
    expect(justText(ulv.shadowRoot!.innerHTML)).not.to.include('5 selected');

    uvd.selected = newSelected;
    expect(
      await eventually(() =>
        justText(uvd.shadowRoot?.innerHTML).includes('1 selected')
      )
    ).to.be.true;
    expect(justText(uvd.shadowRoot!.innerHTML)).to.include('3 selected');
    expect(justText(uvd.shadowRoot!.innerHTML)).not.to.include('2 selected');
    expect(justText(uvd.shadowRoot!.innerHTML)).not.to.include('5 selected');
  });
});
