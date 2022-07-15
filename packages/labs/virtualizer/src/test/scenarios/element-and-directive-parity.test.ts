/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors, justText, until} from '../helpers.js';
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

    const usingLitVirtualizer: UsingLitVirtualizer = await fixture(
      html`<using-lit-virtualizer
        .items=${items}
        .selected=${selected}
      ></using-lit-virtualizer>`
    )!;
    expect(usingLitVirtualizer).to.be.instanceOf(UsingLitVirtualizer);
    await until(() =>
      justText(usingLitVirtualizer.shadowRoot?.innerHTML).includes('2 selected')
    );
    expect(
      justText(usingLitVirtualizer.shadowRoot?.innerHTML).includes('2 selected')
    );

    const usingVirtualizeDirective: UsingVirtualizeDirective = await fixture(
      html`<using-virtualize-directive
        .items=${items}
        .selected=${selected}
      ></using-virtualize-directive>`
    )!;

    await until(
      () => !!usingLitVirtualizer.shadowRoot?.querySelector('lit-virtualizer')
    );
    const litVirtualizer: LitVirtualizer =
      usingLitVirtualizer.shadowRoot!.querySelector('lit-virtualizer')!;
    await until(() =>
      justText(litVirtualizer.innerHTML).includes('2 selected')
    );
    expect(justText(litVirtualizer.innerHTML)).to.include('2 selected');

    const newSelected = new Set([1, 3]);
    usingLitVirtualizer.selected = newSelected;
    usingVirtualizeDirective.selected = newSelected;

    await until(() =>
      justText(usingVirtualizeDirective.shadowRoot?.innerHTML).includes(
        '1 selected'
      )
    );
    expect(justText(usingVirtualizeDirective.shadowRoot?.innerHTML)).to.include(
      '1 selected'
    );
    expect(justText(usingVirtualizeDirective.shadowRoot?.innerHTML)).to.include(
      '3 selected'
    );
    expect(
      justText(usingVirtualizeDirective.shadowRoot?.innerHTML)
    ).not.to.include('2 selected');
    expect(
      justText(usingVirtualizeDirective.shadowRoot?.innerHTML)
    ).not.to.include('5 selected');

    await until(() =>
      justText(usingLitVirtualizer.shadowRoot?.innerHTML).includes('1 selected')
    );
    expect(justText(usingLitVirtualizer.shadowRoot?.innerHTML)).to.include(
      '1 selected'
    );
    expect(justText(usingLitVirtualizer.shadowRoot?.innerHTML)).to.include(
      '3 selected'
    );
    expect(justText(usingLitVirtualizer.shadowRoot?.innerHTML)).not.to.include(
      '2 selected'
    );
    expect(justText(usingLitVirtualizer.shadowRoot?.innerHTML)).not.to.include(
      '5 selected'
    );
  });
});
