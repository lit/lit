/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../helpers.js';
import {html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import '../../lit-virtualizer.js';
import {expect, html as testingHtml, fixture} from '@open-wc/testing';

interface ExampleItem {
  text: string;
}

@customElement('my-example')
export class MyExample extends LitElement {
  items: ExampleItem[] = new Array(100)
    .fill('')
    .map((_, i) => ({text: `Item ${i}`}));

  render() {
    return html`
      <slot @slotchange=${this._onSlotChange} style="display: none;"></slot>
      <lit-virtualizer
        .items=${this.items}
        .renderItem=${(item: ExampleItem) => html`<p>${item.text}</p>`}
      ></lit-virtualizer>
    `;
  }

  _onSlotChange() {
    this.requestUpdate();
  }
}

// This is one minimal repro case for https://github.com/lit/lit/issues/3481.
// This issue occurs when something triggers an immediate re-render of virtualizer
// and an attempt to tear down some internal state before the async initialization
// code for that state had run. In this repro, a slotchange event triggers
// the re-render, but other minimal repro cases are probably possible. The
// fix we've identified is some straightforward guard code to ensure that we
// don't try to tear down state that hasn't yet been set up. It's possible
// we'll end up wanting to short-circuit immediate re-renders earlier (before
// they reach this guard code), but for now this fix seems sufficient.
describe("Don't fail when rerendering before initialization is complete", () => {
  ignoreBenignErrors(beforeEach, afterEach);

  let errorOccurred = false;

  function recordError(err: PromiseRejectionEvent) {
    if (err.reason.stack.indexOf('Virtualizer') > -1) {
      errorOccurred = true;
    }
  }

  addEventListener('unhandledrejection', recordError);

  it('should render without throwing an error', async () => {
    const example = await fixture(
      testingHtml`<my-example>Slot me!</my-example>`
    );
    await customElements.whenDefined('lit-virtualizer');
    const virtualizer = example.shadowRoot!.querySelector('lit-virtualizer')!;
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);
    await virtualizer.layoutComplete;
    removeEventListener('unhandledrejection', recordError);
    expect(errorOccurred).to.equal(false);
  });
});
