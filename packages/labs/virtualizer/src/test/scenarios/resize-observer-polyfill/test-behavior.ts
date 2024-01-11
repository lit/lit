/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';
import {expect, html as testingHtml, fixture} from '@open-wc/testing';

const data = new Array(100).fill('').map((_, idx) => idx);

export async function testBehavior() {
  await import('../../../lit-virtualizer.js');
  const example = (await fixture(
    testingHtml`
        <lit-virtualizer
            .items=${data}
            .renderItem=${(item: number) => html`<div>Item ${item}</div>`}
        ></lit-virtualizer>
        `
  )) as HTMLElement & {layoutComplete: Promise<void>};
  await customElements.whenDefined('lit-virtualizer');
  expect(example).to.be.instanceof(customElements.get('lit-virtualizer'));
  await example.layoutComplete;
  expect(example.textContent).to.contain('Item 0');
  document.body.scrollTo({top: 100000});
  await example.layoutComplete;
  expect(example.textContent).to.contain('Item 99');
}
