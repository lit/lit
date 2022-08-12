/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect} from '@open-wc/testing';
const MAIN_MODULE = '../../lit-virtualizer.js';

describe('main module', () => {
  // The side-effect of the `lit-virtualizer` customElements registry entry
  // is not be cleared between tests, so this test must run first, before the
  // customElements.define() side-effect is invoked on the import.
  it('defines lit-virtualizer element', async () => {
    expect(customElements.get('lit-virtualizer')).to.be.undefined;
    await import(MAIN_MODULE);
    expect(customElements.get('lit-virtualizer')).to.be.instanceOf(Function);
  });
  it('exports LitVirtualizer', async () => {
    const {LitVirtualizer} = await import(MAIN_MODULE);
    expect(LitVirtualizer).to.be.instanceOf(Function);
  });
  it('exports RangeChangedEvent', async () => {
    const {RangeChangedEvent} = await import(MAIN_MODULE);
    expect(RangeChangedEvent.prototype).to.be.instanceOf(Event);
  });
  it('exports VisibilityChangedEvent', async () => {
    const {VisibilityChangedEvent} = await import(MAIN_MODULE);
    expect(VisibilityChangedEvent.prototype).to.be.instanceOf(Event);
  });
});
