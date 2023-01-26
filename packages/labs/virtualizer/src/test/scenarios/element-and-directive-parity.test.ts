/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {array, ignoreBenignErrors, until} from '../helpers.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {virtualize} from '../../virtualize.js';
import {RangeChangedEvent, VisibilityChangedEvent} from '../../events.js';
import {css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {expect, html, fixture} from '@open-wc/testing';

abstract class TestElement extends LitElement {
  static styles = css`
    .item {
      height: 50px;
      margin: 0;
      padding: 0;
    }
  `;

  @property({type: Object, attribute: false})
  public selected: Set<number> = new Set();

  @property({type: Array, attribute: false})
  public items: Array<number> = [];

  @property({type: Array, attribute: false})
  public rangeChangedEvents: RangeChangedEvent[] = [];

  @property({type: Array, attribute: false})
  public visibilityChangedEvents: VisibilityChangedEvent[] = [];

  recordRangeChangedEvent(event: RangeChangedEvent) {
    this.rangeChangedEvents.push(event);
  }

  recordVisibilityChangedEvent(event: VisibilityChangedEvent) {
    this.visibilityChangedEvents.push(event);
  }
}

@customElement('using-lit-virtualizer')
class UsingLitVirtualizer extends TestElement {
  render() {
    return html` <lit-virtualizer
      @rangeChanged=${this.recordRangeChangedEvent}
      @visibilityChanged=${this.recordVisibilityChangedEvent}
      scroller
      .items=${this.items}
      .renderItem=${(n: number) =>
        html`<div class="item">
          [${n}${this.selected.has(n) ? ' selected' : ''}]
        </div>`}
    ></lit-virtualizer>`;
  }
}

@customElement('using-virtualize-directive')
class UsingVirtualizeDirective extends TestElement {
  render() {
    return html` <div
      @rangeChanged=${this.recordRangeChangedEvent}
      @visibilityChanged=${this.recordVisibilityChangedEvent}
    >
      ${virtualize({
        scroller: true,
        items: this.items,
        renderItem: (n) =>
          html`<div class="item">
            [${n}${this.selected.has(n) ? ' selected' : ''}]
          </div>`,
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
      <style>
        using-lit-virtualizer {
          height: 500px;
        }
        using-virtualize-directive {
          height: 500px;
        }
      </style>
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
    const uvd: UsingVirtualizeDirective = example.querySelector(
      'using-virtualize-directive'
    )!;

    ulv.items = [...items];
    uvd.items = [...items];

    ulv.selected = selected;
    uvd.selected = selected;

    await until(() => ulv.shadowRoot?.textContent?.includes('[5 selected]'));
    await until(() => uvd.shadowRoot?.textContent?.includes('[5 selected]'));

    expect(ulv.shadowRoot?.textContent).to.include('[2 selected]');
    expect(uvd.shadowRoot?.textContent).to.include('[2 selected]');

    expect(ulv.shadowRoot?.textContent).to.include('[5 selected]');
    expect(uvd.shadowRoot?.textContent).to.include('[5 selected]');

    // Changing selection doesn't trigger visibility changed or range changed events.
    ulv.selected = new Set([1, 3]);
    uvd.selected = new Set([1, 3]);

    await until(() => ulv.shadowRoot?.textContent?.includes('[3 selected]'));
    await until(() => uvd.shadowRoot?.textContent?.includes('[3 selected]'));

    expect(ulv.shadowRoot?.textContent).to.include('[1 selected]');
    expect(uvd.shadowRoot?.textContent).to.include('[1 selected]');

    expect(ulv.shadowRoot?.textContent).to.include('[3 selected]');
    expect(uvd.shadowRoot?.textContent).to.include('[3 selected]');

    expect(ulv.shadowRoot?.textContent).not.to.include('[2 selected]');
    expect(uvd.shadowRoot?.textContent).not.to.include('[2 selected]');

    expect(ulv.shadowRoot?.textContent).not.to.include('[5 selected]');
    expect(uvd.shadowRoot?.textContent).not.to.include('[5 selected]');

    // Clearing event arrays so we can watch for specific future events.
    ulv.rangeChangedEvents.splice(0);
    uvd.rangeChangedEvents.splice(0);
    ulv.visibilityChangedEvents.splice(0);
    uvd.visibilityChangedEvents.splice(0);

    // Adding an item to the start of the list to trigger rangechanged and
    // visibilitychanged events.
    ulv.items = [-1, ...items];
    uvd.items = [-1, ...items];

    await until(() => ulv.shadowRoot?.textContent?.includes('[-1]'));
    await until(() => uvd.shadowRoot?.textContent?.includes('[-1]'));

    await until(() => ulv.rangeChangedEvents.length > 0);
    await until(() => uvd.rangeChangedEvents.length > 0);

    expect(ulv.rangeChangedEvents.length).to.equal(1);
    expect(uvd.rangeChangedEvents.length).to.equal(1);

    // The indexes of visible items have not changed even though new item was
    // added to head of the array.  So no visibilitychanged events are expected.
    expect(ulv.visibilityChangedEvents.length).to.equal(0);
    expect(uvd.visibilityChangedEvents.length).to.equal(0);
  });
});
