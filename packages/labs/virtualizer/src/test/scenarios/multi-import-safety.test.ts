/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect} from '@open-wc/testing';

describe('multi-import safety', () => {
  it('does not throw when lit-virtualizer is imported after already being defined', async () => {
    // First import — registers the element
    const {LitVirtualizer} = await import('../../lit-virtualizer.js');
    expect(customElements.get('lit-virtualizer')).to.equal(LitVirtualizer);

    // Simulate a second bundle calling define with the same tag name.
    // Before the fix, this would throw:
    //   NotSupportedError: the name "lit-virtualizer" has already been used
    expect(() => {
      LitVirtualizer.define();
    }).not.to.throw();
  });

  it('registers the element exactly once across multiple define calls', async () => {
    const {LitVirtualizer} = await import('../../lit-virtualizer.js');
    const registered = customElements.get('lit-virtualizer');
    expect(registered).to.equal(LitVirtualizer);

    // Call define again — should be a no-op
    LitVirtualizer.define();

    // The registered constructor must still be the same
    expect(customElements.get('lit-virtualizer')).to.equal(registered);
  });

  it('is safe to call define many times in succession', async () => {
    const {LitVirtualizer} = await import('../../lit-virtualizer.js');

    expect(() => {
      for (let i = 0; i < 10; i++) {
        LitVirtualizer.define();
      }
    }).not.to.throw();

    expect(customElements.get('lit-virtualizer')).to.equal(LitVirtualizer);
  });

  it('bare customElements.define would throw without the guard', async () => {
    const {LitVirtualizer} = await import('../../lit-virtualizer.js');

    // Confirm the element is registered
    expect(customElements.get('lit-virtualizer')).to.equal(LitVirtualizer);

    // A bare customElements.define (without a guard) throws — this is the
    // original bug. Our fix prevents this by checking before defining.
    expect(() => {
      customElements.define('lit-virtualizer', LitVirtualizer);
    }).to.throw();
  });

  it('simulates multi-bundle scenario with direct customElements.define guard', async () => {
    // This test simulates what a second bundle would do:
    // check-then-define, matching the pattern in lit-virtualizer.ts
    const {LitVirtualizer} = await import('../../lit-virtualizer.js');

    // The element is already defined from the import
    expect(customElements.get('lit-virtualizer')).to.equal(LitVirtualizer);

    // A second bundle would do the same guard check
    const alreadyDefined = customElements.get('lit-virtualizer');
    if (!alreadyDefined) {
      // This branch should NOT execute since it's already defined
      customElements.define('lit-virtualizer', LitVirtualizer);
    }

    // Confirm element is still properly registered
    expect(customElements.get('lit-virtualizer')).to.equal(LitVirtualizer);
  });

  it('virtualizerRef symbol is shared across module loads via Symbol.for', async () => {
    const {virtualizerRef} = await import('../../Virtualizer.js');

    // The symbol should be the global Symbol.for key, meaning any
    // other bundle using the same key gets the same symbol
    const expectedSymbol = Symbol.for('@lit-labs/virtualizer/virtualizerRef');
    expect(virtualizerRef).to.equal(expectedSymbol);
  });
});
