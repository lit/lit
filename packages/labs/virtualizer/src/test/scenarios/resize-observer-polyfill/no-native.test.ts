/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../../helpers.js';
import {expect} from '@open-wc/testing';

import {testBehavior} from './test-behavior.js';

type ROOptional = Omit<Window, 'ResizeObserver'> & {
  ResizeObserver?: typeof ResizeObserver;
};
const NativeResizeObserver = window.ResizeObserver;
// Delete native implementation from `window` to force polyfill to load
delete (window as ROOptional).ResizeObserver;

describe('ResizeObserver polyfill and loader should work', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('should load the polyfill as needed', async () => {
    const {loadPolyfillIfNeeded} = await import(
      '../../../polyfillLoaders/ResizeObserver.js'
    );
    const RO = await loadPolyfillIfNeeded();
    expect(RO).not.to.equal(NativeResizeObserver);
    testBehavior();
  });
});
