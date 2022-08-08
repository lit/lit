/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {array, ignoreBenignErrors, until} from '../helpers.js';
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

  /**
   * Regression test to cover the difference in behavior which led
   * to this issue: https://github.com/lit/lit/issues/3052
   */
  it('both render changes based on non-item data changes', async () => {
    const items = array(100);
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

    await until(() => ulv.shadowRoot?.textContent?.includes('2 selected'));

    expect(ulv.shadowRoot?.textContent).to.include('2 selected');
    expect(ulv.shadowRoot?.textContent).to.include('5 selected');

    const uvd: UsingVirtualizeDirective = example.querySelector(
      'using-virtualize-directive'
    )!;

    uvd.items = items;
    uvd.selected = selected;

    await until(() => uvd.shadowRoot?.textContent?.includes('2 selected'));

    expect(uvd.shadowRoot?.textContent).to.include('2 selected');
    expect(uvd.shadowRoot?.textContent).to.include('5 selected');

    const newSelected = new Set([1, 3]);

    ulv.selected = newSelected;

    await until(() => ulv.shadowRoot?.textContent?.includes('1 selected'));

    expect(ulv.shadowRoot?.textContent).to.include('1 selected');
    expect(ulv.shadowRoot?.textContent).to.include('3 selected');
    expect(ulv.shadowRoot?.textContent).not.to.include('2 selected');
    expect(ulv.shadowRoot?.textContent).not.to.include('5 selected');

    uvd.selected = newSelected;

    await until(() => uvd.shadowRoot?.textContent?.includes('1 selected'));

    expect(uvd.shadowRoot?.textContent).to.include('1 selected');
    expect(uvd.shadowRoot?.textContent).to.include('3 selected');
    expect(uvd.shadowRoot?.textContent).not.to.include('2 selected');
    expect(uvd.shadowRoot?.textContent).not.to.include('5 selected');
  });
});
