/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../helpers.js';
import {html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {LitVirtualizer} from '../../lit-virtualizer.js';
import {ChildPositioningMethod} from '../../Virtualizer.js';
import '../../lit-virtualizer.js';
import {expect, html as testingHtml, fixture} from '@open-wc/testing';

@customElement('positioning-test-translate')
export class TranslateExample extends LitElement {
  items = new Array(100).fill('').map((_, i) => ({text: `Item ${i}`}));

  render() {
    return html`
      <lit-virtualizer
        scroller
        style="height: 400px"
        .items=${this.items}
        .renderItem=${(item: {text: string}) =>
          html`<div style="height: 50px">${item.text}</div>`}
      ></lit-virtualizer>
    `;
  }
}

@customElement('positioning-test-absolute')
export class AbsoluteExample extends LitElement {
  items = new Array(100).fill('').map((_, i) => ({text: `Item ${i}`}));

  render() {
    return html`
      <lit-virtualizer
        scroller
        style="height: 400px"
        positioning="absolute"
        .items=${this.items}
        .renderItem=${(item: {text: string}) =>
          html`<div style="height: 50px">${item.text}</div>`}
      ></lit-virtualizer>
    `;
  }
}

@customElement('positioning-test-configurable')
export class ConfigurableExample extends LitElement {
  @property()
  positioning: ChildPositioningMethod = 'translate';

  items = new Array(100).fill('').map((_, i) => ({text: `Item ${i}`}));

  render() {
    return html`
      <lit-virtualizer
        scroller
        style="height: 400px"
        .positioning=${this.positioning}
        .items=${this.items}
        .renderItem=${(item: {text: string}) =>
          html`<div style="height: 50px">${item.text}</div>`}
      ></lit-virtualizer>
    `;
  }
}

describe('Child positioning method', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('uses translate transforms by default', async () => {
    const example = await fixture(
      testingHtml`<positioning-test-translate></positioning-test-translate>`
    );
    await customElements.whenDefined('lit-virtualizer');
    const virtualizer = example.shadowRoot!.querySelector(
      'lit-virtualizer'
    )! as LitVirtualizer;
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);
    await virtualizer.layoutComplete;
    expect(virtualizer.children.length).to.be.greaterThan(0);
    const child = virtualizer.children[0] as HTMLElement;
    expect(child.style.transform).to.include('translate');
    expect(child.style.left).to.equal('');
    expect(child.style.top).to.equal('');
  });

  it('uses left/top positioning when positioning is "absolute"', async () => {
    const example = await fixture(
      testingHtml`<positioning-test-absolute></positioning-test-absolute>`
    );
    await customElements.whenDefined('lit-virtualizer');
    const virtualizer = example.shadowRoot!.querySelector(
      'lit-virtualizer'
    )! as LitVirtualizer;
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);
    await virtualizer.layoutComplete;
    expect(virtualizer.children.length).to.be.greaterThan(0);
    const child = virtualizer.children[0] as HTMLElement;
    expect(child.style.transform).to.equal('');
    expect(child.style.left).to.not.equal('');
    expect(child.style.top).to.not.equal('');
    expect(child.style.left).to.include('px');
    expect(child.style.top).to.include('px');
  });

  it('produces the same visual layout with both methods', async () => {
    const translateExample = await fixture(
      testingHtml`<positioning-test-configurable></positioning-test-configurable>`
    );
    const absoluteExample = (await fixture(
      testingHtml`<positioning-test-configurable .positioning=${'absolute'}></positioning-test-configurable>`
    )) as ConfigurableExample;

    const translateVirtualizer =
      translateExample.shadowRoot!.querySelector('lit-virtualizer')!;
    const absoluteVirtualizer =
      absoluteExample.shadowRoot!.querySelector('lit-virtualizer')!;

    await (translateVirtualizer as LitVirtualizer).layoutComplete;
    await (absoluteVirtualizer as LitVirtualizer).layoutComplete;

    const translateChildren = Array.from(
      translateVirtualizer.children
    ) as HTMLElement[];
    const absoluteChildren = Array.from(
      absoluteVirtualizer.children
    ) as HTMLElement[];

    expect(translateChildren.length).to.be.greaterThan(0);
    expect(absoluteChildren.length).to.be.greaterThan(0);

    // Compare positions of the first few children
    const count = Math.min(
      translateChildren.length,
      absoluteChildren.length,
      5
    );
    for (let i = 0; i < count; i++) {
      const tRect = translateChildren[i].getBoundingClientRect();
      const aRect = absoluteChildren[i].getBoundingClientRect();
      // Heights should match
      expect(tRect.height).to.equal(aRect.height);
      // Widths should match
      expect(tRect.width).to.equal(aRect.width);
    }
  });
});
