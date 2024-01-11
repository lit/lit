/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../../helpers.js';
import {expect} from '@open-wc/testing';

import {testBehavior} from './test-behavior.js';

describe('ResizeObserver polyfill and loader should work', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('should use native ResizeObserver when available', async () => {
    const {loadPolyfillIfNeeded} = await import(
      '../../../polyfillLoaders/ResizeObserver.js'
    );
    const RO = await loadPolyfillIfNeeded();
    expect(RO).to.equal(window.ResizeObserver);
    testBehavior();
  });
});
