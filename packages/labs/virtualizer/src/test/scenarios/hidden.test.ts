/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../helpers.js';
import {html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import '../../lit-virtualizer.js';
import {expect, fixture} from '@open-wc/testing';

/*
  This file contains regression tests for https://github.com/lit/lit/issues/3815
  and https://github.com/lit/lit/issues/4672
*/

type Item = {label: number};

@customElement('virtualizer-hider')
export class VirtualizerHider extends LitElement {
  _list: Item[] = Array(100)
    .fill('')
    .map((_, index) => ({
      label: index,
    }));

  @property({type: Boolean})
  hidden = false;

  render() {
    return html`
      <button @click=${() => (this.hidden = !this.hidden)}>Toggle</button>
      <div style="display:${this.hidden ? 'none' : 'block'}">
        <lit-virtualizer
          .items=${this._list}
          .renderItem=${({label}: Item) => html`<div>${label}</div>`}
        ></lit-virtualizer>
      </div>
    `;
  }
}

describe("Don't render any children if the virtualizer is hidden", () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('should not render any children when initially hidden', async () => {
    const el = await fixture<VirtualizerHider>(html`
      <virtualizer-hider hidden></virtualizer-hider>
    `);
    const virtualizer = el.shadowRoot!.querySelector('lit-virtualizer')!;
    // We can't await on layoutComplete when first render is empty.
    // See https://github.com/lit/lit/issues/4376
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(virtualizer.children.length).to.equal(0);
  });

  it('should not render any children when subsequently hidden', async () => {
    const el = await fixture<VirtualizerHider>(html`
      <virtualizer-hider></virtualizer-hider>
    `);
    const virtualizer = el.shadowRoot!.querySelector('lit-virtualizer')!;
    await virtualizer.layoutComplete;
    expect(virtualizer.children.length).to.be.greaterThan(0);

    el.hidden = true;
    await virtualizer.layoutComplete;
    expect(virtualizer.children.length).to.equal(0);
  });

  // Issue #4672
  it('should not render any children when hidden and nested beneath a clipping ancestor', async () => {
    const clipper = await fixture<HTMLDivElement>(html`
      <div style="overflow: hidden;">
        <virtualizer-hider></virtualizer-hider>
      </div>
    `);
    const el = clipper.querySelector('virtualizer-hider')! as VirtualizerHider;
    const virtualizer = el.shadowRoot!.querySelector('lit-virtualizer')!;
    await virtualizer.layoutComplete;
    expect(virtualizer.children.length).to.be.greaterThan(0);

    el.hidden = true;
    await virtualizer.layoutComplete;
    expect(virtualizer.children.length).to.equal(0);
  });
});
