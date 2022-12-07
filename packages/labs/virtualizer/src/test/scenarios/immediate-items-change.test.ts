/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../helpers.js';
import {html, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import '../../lit-virtualizer.js';
import {grid} from '../../layouts/grid.js';
import {expect, html as testingHtml, fixture} from '@open-wc/testing';

@customElement('my-example')
export class MyExample extends LitElement {
  @state()
  data: number[] = [];

  override async firstUpdated() {
    this.data = [0, 1];
    await new Promise(requestAnimationFrame);
    this.data = [2, 3];
  }

  override render() {
    return html`
      <lit-virtualizer
        .layout=${grid({
          itemSize: {width: '100px', height: '100px'},
          gap: '0px',
        })}
        .items=${this.data}
        .renderItem=${(item: number) => html`<div>${item}</div>`}
      >
      </lit-virtualizer>
    `;
  }
}

// This is one minimal repro case for https://github.com/lit/lit/issues/3243.
// The issue was originally reported in a more complicated case involving the
// use of lit-mobx. Other minimal repro cases are probably possible.
// The fix we've identified for this issue is a low-level change to the logic
// for completing the virtualizer update cycle after children have been
// rendered or re-rendered.
describe('Successful DOM update on immediate change to items', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('should apply transforms to DOM children', async () => {
    const example = (await fixture(
      testingHtml`<my-example></my-example>`
    )) as MyExample;
    expect(example).to.be.instanceof(MyExample);
    await new Promise(requestAnimationFrame);
    const children = Array.from(
      example.shadowRoot!.querySelector('lit-virtualizer')!.children
    ) as HTMLElement[];
    const firstChild = children[0];
    const secondChild = children[1];
    // This test is brittle; it will break if we ever change the way we
    // position children in the DOM. But including it here because it's
    // an unambiguous way of illustrating the issue that spurred this test:
    // if the transforms haven't been applied, it means that the DOM update
    // wasn't successfully completed
    const translationApplied =
      firstChild.style.transform.indexOf('translate') !== -1 &&
      secondChild.style.transform.indexOf('translate') !== -1;
    expect(translationApplied).to.equal(true);
    // This test doesn't rely on the aforementioned implementation detail; as
    // long as the grid() layout API and behavior don't change, the fact that
    // this test passes should indicate that the DOM update was successful
    const xOffset =
      secondChild.getBoundingClientRect().left -
      firstChild.getBoundingClientRect().left;
    expect(xOffset).to.equal(100);
  });
});
