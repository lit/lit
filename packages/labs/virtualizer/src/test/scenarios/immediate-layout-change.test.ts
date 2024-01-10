/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../helpers.js';
import {html, css, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import '../../lit-virtualizer.js';
import {flow} from '../../layouts/flow.js';
import {grid} from '../../layouts/grid.js';
import {expect, html as testingHtml, fixture} from '@open-wc/testing';

type LayoutSpecifier = typeof LitVirtualizer.prototype.layout;

@customElement('my-example')
export class MyExample extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
  `;
  data: string[] = new Array(1000).fill('').map((_, idx) => `Item ${idx}`);

  @state()
  layout: LayoutSpecifier | undefined = flow();

  override render() {
    return html`
      <lit-virtualizer
        scroller
        .layout=${this.hasAttribute('control')
          ? grid({itemSize: '100px'})
          : this.layout!}
        .items=${this.data}
        .renderItem=${(item: string) => html`<div>${item}</div>`}
      ></lit-virtualizer>
    `;
  }

  override async firstUpdated() {
    if (!this.hasAttribute('control')) {
      this.layout = grid({itemSize: '100px'});
    }
  }
}

// This is a new repro case for https://github.com/lit/lit/issues/3481,
// which was reopened because the original fix didn't suffice when application
// code caused a new layout to be specified while virtualizer was still in the
// (async) process of initializing the originally specified layout. The new
// fix explicitly accounts for this case; at the same time, the virtualizer
// intitialization code has been signficantly simplified.
describe("Don't behave badly when changing layouts before initialization is complete", () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('should render the control and repro cases identically after scrolling', async () => {
    const example: LitElement = await fixture(
      testingHtml`
        <my-example control></my-example>
        <my-example></my-example>
      `
    );
    // The symptom of the issue is that rendering is incorrect / unstable
    // after scrolling. It turns out that both the original layout and the
    // newly specified layout were instantiated and trying to control the
    // same virtualizer (oops).
    const [control, repro] = [example, example.nextElementSibling];
    await control.updateComplete;
    await new Promise(requestAnimationFrame);
    const controlVirtualizer =
      control.shadowRoot!.querySelector('lit-virtualizer')!;
    const reproVirtualizer =
      repro!.shadowRoot!.querySelector('lit-virtualizer')!;
    controlVirtualizer.scrollBy(0, 2000);
    reproVirtualizer.scrollBy(0, 2000);
    await Promise.all([
      controlVirtualizer.layoutComplete,
      reproVirtualizer.layoutComplete,
    ]);
    expect(reproVirtualizer.textContent).to.equal(
      controlVirtualizer.textContent
    );
  });
});
