/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../helpers.js';
import {html, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import '../../lit-virtualizer.js';
import {flow} from '../../layouts/flow.js';
import {expect, html as testingHtml, fixture} from '@open-wc/testing';

/**
 * Regression coverage for the documentation added in
 * https://github.com/lit/lit/issues/3249.
 *
 * The `items` property of a virtualizer (and the `items` config option of
 * the `virtualize` directive) is a Lit reactive property / option. By
 * default Lit uses strict reference equality (`!==`) to determine whether
 * the value has changed and a re-render is required. This means that
 * mutating an array in place (e.g. via `Array.prototype.reverse()`) will
 * not trigger a re-render. Users have to assign a new array to the
 * property to get a re-render. These tests pin that contract so that any
 * future change is intentional.
 */
describe('Virtualizer `items` re-render contract (issue #3249)', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('re-renders when a new array is assigned, even with the same contents', async () => {
    const initial = ['a', 'b', 'c'];
    const reversed = ['c', 'b', 'a'];

    const example = (await fixture(
      testingHtml`<items-reassignment></items-reassignment>`
    )) as ItemsReassignment;

    example.items = initial;
    await new Promise(requestAnimationFrame);
    expect(textOf(example)).to.equal('a b c');

    // Assigning a brand new array with the same contents must trigger
    // a re-render. This is the same behavior the Lit reactive property
    // contract provides: identity change → re-render.
    example.items = [...initial];
    await new Promise(requestAnimationFrame);
    expect(textOf(example)).to.equal('a b c');

    // Assigning a new array with new contents must also re-render.
    example.items = reversed;
    await new Promise(requestAnimationFrame);
    expect(textOf(example)).to.equal('c b a');
  });

  it('does NOT re-render when the array is mutated in place', async () => {
    const shared = ['a', 'b', 'c'];
    const example = (await fixture(
      testingHtml`<items-mutation></items-mutation>`
    )) as ItemsMutation;

    example.items = shared;
    await new Promise(requestAnimationFrame);
    expect(textOf(example)).to.equal('a b c');

    // Mutate the array in place. The virtualizer must NOT pick this
    // up, because the property still references the same array (and
    // the virtualizer's own `items` setter uses `!==` as well).
    example.items.reverse();
    await new Promise(requestAnimationFrame);
    expect(textOf(example)).to.equal('a b c');

    // ...unless the user explicitly assigns a new array, in which
    // case the virtualizer sees the new reference and re-renders.
    example.items = [...example.items].reverse();
    await new Promise(requestAnimationFrame);
    expect(textOf(example)).to.equal('c b a');
  });
});

const textOf = (el: LitElement) =>
  (el.shadowRoot?.textContent ?? '').replace(/\s+/g, ' ').trim();

@customElement('items-reassignment')
class ItemsReassignment extends LitElement {
  @state() items: string[] = [];

  override render() {
    return html`
      <lit-virtualizer
        .layout=${flow()}
        .items=${this.items}
        .renderItem=${(item: string) => html`<span>${item}</span>`}
      ></lit-virtualizer>
    `;
  }
}

@customElement('items-mutation')
class ItemsMutation extends LitElement {
  @state() items: string[] = [];

  override render() {
    return html`
      <lit-virtualizer
        .layout=${flow()}
        .items=${this.items}
        .keyFunction=${(_: string, idx: number) => idx}
        .renderItem=${(item: string) => html`<span>${item}</span>`}
      ></lit-virtualizer>
    `;
  }
}
