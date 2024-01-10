/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../helpers.js';
import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import '../../lit-virtualizer.js';
import {masonry} from '../../layouts/masonry.js';
import {expect, html as testingHtml, fixture} from '@open-wc/testing';

/*
  This file contains regression tests for https://github.com/lit/lit/issues/3815
*/

type Item = {aspectRatio: number};

@customElement('masonry-gotchas')
export class MasonryGotchas extends LitElement {
  static styles = css`
    div {
      background: blue;
    }
    lit-virtualizer {
      background: pink;
    }
    :host {
      width: 400px;
      display: block;
    }
  `;

  @property()
  itemSize: `${number}px` = '150px';

  @property({type: Array})
  items: Item[] = [{aspectRatio: 1}, {aspectRatio: 2}];

  render() {
    return html`
      <lit-virtualizer
        .layout=${masonry({
          itemSize: this.itemSize,
          flex: false,
          gap: '8px',
          getAspectRatio: (item) => (item as unknown as Item).aspectRatio,
        })}
        .items=${this.items}
        .renderItem=${(_: Item) => html` <div></div> `}
      ></lit-virtualizer>
    `;
  }
}

describe("Size virtualizer properly even if last item placed doesn't extend the furthest", () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('should size the virtualizer to contain the first (largest) child', async () => {
    const el = await fixture<MasonryGotchas>(
      testingHtml`
        <masonry-gotchas></masonry-gotchas>
      `
    );
    const virtualizer = el.shadowRoot!.querySelector('lit-virtualizer')!;
    const virtualizerHeight = virtualizer.getBoundingClientRect().height;
    const firstChildHeight =
      virtualizer.children[0].getBoundingClientRect().height;
    // First child height plus leading and trailing 8px gaps
    expect(virtualizerHeight).to.equal(firstChildHeight + 16);
  });
});

describe("Calculate range properly even if last item placed doesn't extend the furthest", () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('should render both children', async () => {
    const el = await fixture<MasonryGotchas>(
      testingHtml`
          <masonry-gotchas itemSize="180px"></masonry-gotchas>
        `
    );
    const virtualizer = el.shadowRoot!.querySelector('lit-virtualizer')!;
    expect(virtualizer.children.length).to.equal(2);
  });

  it('should render all three children', async () => {
    const el = await fixture<MasonryGotchas>(
      testingHtml`
          <masonry-gotchas></masonry-gotchas>
        `
    );
    el.items = [{aspectRatio: 1}, {aspectRatio: 0.5}, {aspectRatio: 2}];
    const virtualizer = el.shadowRoot!.querySelector('lit-virtualizer')!;
    await virtualizer.layoutComplete;
    expect(virtualizer.children.length).to.equal(3);
  });
});
