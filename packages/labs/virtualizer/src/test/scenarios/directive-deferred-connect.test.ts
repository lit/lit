/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {ignoreBenignErrors, until} from '../helpers.js';
import {virtualize} from '../../virtualize.js';
import {
  Virtualizer,
  virtualizerRef,
  VirtualizerHostElement,
} from '../../Virtualizer.js';
import {expect, fixture} from '@open-wc/testing';

/*
  Regression test for https://github.com/lit/lit/issues/5290

  The `virtualize` directive previously called `Virtualizer.connected()`
  synchronously during its first update, while the host element was still
  inside an unattached `DocumentFragment` produced by lit-html's template
  instantiation. At that point, `getComputedStyle()` on ancestors returned
  empty values and the ancestor walk truncated at the fragment boundary,
  causing clipping-ancestor detection to cache an incorrect list. The
  list was reused once the DOM was committed, producing wrong viewport
  math -- visible as items failing to render in some positioning
  scenarios.
*/

const items = ['foo', 'bar', 'foobar', 'fizzbuzz'];

@customElement('x-5290-position-absolute-bottom')
class PositionAbsoluteBottom extends LitElement {
  static styles = css`
    #parent {
      position: relative;
      width: 200px;
      height: 80px;
    }
    #host {
      position: absolute;
      bottom: -80px;
      width: 200px;
      height: 80px;
    }
  `;

  render() {
    return html`
      <div id="parent">
        <div id="host">
          ${virtualize({
            items,
            renderItem: (item: string) => html`<div>${item}</div>`,
          })}
        </div>
      </div>
    `;
  }
}

async function awaitVirtualizer(host: HTMLElement): Promise<Virtualizer> {
  return until(() => (host as VirtualizerHostElement)[virtualizerRef]!);
}

describe('virtualize directive: connect after host is attached (#5290)', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  // The exact geometric scenario from #5290. A `virtualize` directive
  // inside a `position: absolute` element whose bounding rect is offset
  // outside its containing block should still render its items.
  it('renders items when the host is positioned outside its parent rect', async () => {
    const el = (await fixture(html`
      <x-5290-position-absolute-bottom></x-5290-position-absolute-bottom>
    `)) as PositionAbsoluteBottom;

    const host = el.shadowRoot!.getElementById('host')!;
    const virtualizer = await awaitVirtualizer(host);
    await virtualizer.layoutComplete;

    // All four items should be rendered as DOM children of the host.
    expect(host.textContent).to.contain('foo');
    expect(host.textContent).to.contain('bar');
    expect(host.textContent).to.contain('foobar');
    expect(host.textContent).to.contain('fizzbuzz');
  });
});
