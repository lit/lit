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
      <lit-virtualizer
        .items=${this.items}
        .renderItem=${(item: ExampleItem) => html`<p>${item.text}</p>`}
      ></lit-virtualizer>
    `;
  }
}

describe('Basic layoutComplete functionality works', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('resolves as soon as virtualizer has rendered, not before', async () => {
    const example = await fixture(testingHtml`<my-example></my-example>`);
    await customElements.whenDefined('lit-virtualizer');
    const virtualizer = example.shadowRoot!.querySelector('lit-virtualizer')!;
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);
    // Before layoutComplete, we shouldn't have rendered
    expect(virtualizer.children.length).to.equal(0);
    await virtualizer.layoutComplete;
    // After layoutComplete, we should have rendered children
    expect(virtualizer.children.length).to.be.greaterThan(0);
    // And our children should have been explicitly positioned.
    // This test depends on an implementation detail; will need to be
    // updated if we ever change the way we position children in the DOM.
    expect(
      (virtualizer.children[0] as HTMLElement).style.transform.indexOf(
        'translate'
      )
    ).to.be.greaterThan(-1);
  });

  it('returns the same promise when layoutComplete is accessed repeatedly during a single cycle', async () => {
    const example = await fixture(testingHtml`<my-example></my-example>`);
    await customElements.whenDefined('lit-virtualizer');
    const virtualizer = example.shadowRoot!.querySelector('lit-virtualizer')!;
    const lc1 = virtualizer.layoutComplete;
    const lc2 = virtualizer.layoutComplete;
    await Promise.resolve();
    const lc3 = virtualizer.layoutComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    const lc4 = virtualizer.layoutComplete;
    expect(lc1 === lc2 && lc2 === lc3 && lc3 === lc4).to.equal(true);
  });

  it('resolves when accessed after the layout cycle has already completed', async function () {
    this.timeout(5000);
    const example = await fixture(testingHtml`<my-example></my-example>`);
    await customElements.whenDefined('lit-virtualizer');
    const virtualizer = example.shadowRoot!.querySelector('lit-virtualizer')!;
    // Complete the initial layout through the normal path.
    await virtualizer.layoutComplete;
    expect(virtualizer.children.length).to.be.greaterThan(0);
    // Wait for everything to fully settle. After this, no more
    // ResizeObserver callbacks or layout cycles should be pending.
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Now access layoutComplete again. The previous promise was
    // resolved and state was reset, so the getter will create a
    // new promise. Since no layout work is pending, nothing will
    // call _scheduleLayoutComplete to resolve it — unless the
    // getter handles this case explicitly.
    const timeout = new Promise<string>((resolve) =>
      setTimeout(() => resolve('timeout'), 1000)
    );
    const result = await Promise.race([
      virtualizer.layoutComplete!.then(() => 'resolved'),
      timeout,
    ]);
    expect(result).to.equal('resolved');
  });
});
