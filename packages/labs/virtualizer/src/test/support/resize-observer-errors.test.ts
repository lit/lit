/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ignoreWindowResizeObserverLoopErrors,
  preventResizeObserverLoopErrorEventDefaults,
  setupIgnoreWindowResizeObserverLoopErrors,
} from '../../support/resize-observer-errors.js';
import {expect} from '@open-wc/testing';
import {pass, ignoreWindowErrors} from '../helpers.js';

let errors = 0;

class CountingError extends Error {
  constructor(message: string) {
    ++errors;
    super(message);
  }
}

async function windowError(message: string) {
  const expectedErrorCount = errors + 1;
  setTimeout(() => {
    throw new CountingError(message);
  });
  await pass(() => expect(errors).to.be.greaterThanOrEqual(expectedErrorCount));
}

beforeEach(() => (errors = 0));

describe('ignoreWindowResizeObserverLoopErrors', () => {
  let teardown: Function | undefined;
  beforeEach(() => (teardown = ignoreWindowResizeObserverLoopErrors()));
  afterEach(() => teardown?.());

  it('throwing a CountingError adds to error count', () => {
    try {
      throw new CountingError('ResizeObserver loop limit exceeded');
    } catch (e) {
      expect(e).to.be.instanceOf(CountingError);
    }
    expect(errors).to.equal(1);
  });

  it('testing framework using window.error ignores loop limit errors', async () => {
    expect(errors).to.equal(0);
    await windowError('ResizeObserver loop limit exceeded');
    await windowError(
      'ResizeObserver loop completed with undelivered notifications'
    );
    expect(errors).to.equal(2);
  });
});

describe('setupIgnoreWindowResizeObserverLoopErrors', () => {
  setupIgnoreWindowResizeObserverLoopErrors(beforeEach, afterEach);

  it('throwing a CountingError adds to error count', () => {
    try {
      throw new CountingError('ResizeObserver loop limit exceeded');
    } catch (e) {
      expect(e).to.be.instanceOf(CountingError);
    }
    expect(errors).to.equal(1);
  });

  it('testing framework using window.error ignores loop limit errors', async () => {
    expect(errors).to.equal(0);
    await windowError('ResizeObserver loop limit exceeded');
    await windowError(
      'ResizeObserver loop completed with undelivered notifications'
    );
    expect(errors).to.equal(2);
  });
});

describe('preventResizeObserverLoopErrorEventDefaults', () => {
  ignoreWindowErrors(
    beforeEach,
    afterEach,
    /ResizeObserver|Do not record this error/
  );

  it('event propagation and default behavior are stopped for loop limit error events', async () => {
    const messages: string[] = [];
    const removeEventListener = preventResizeObserverLoopErrorEventDefaults();

    // Note we add the listener to record errors *after* preventResizeObserverLoopErrorEventDefaults
    // because there is no way to reorder event listeners and prevent needs to be first in line to
    // work properly in this case.
    window.addEventListener('error', (e) => messages.push(e.message));

    await windowError('ResizeObserver loop limit exceeded');
    expect(messages).to.deep.equal([]);

    await windowError('Do not record this error');
    await pass(() =>
      expect(messages).to.deep.equal([
        'Uncaught Error: Do not record this error',
      ])
    );
    removeEventListener();
    await windowError('ResizeObserver loop limit exceeded');
    await pass(() =>
      expect(messages).to.deep.equal([
        'Uncaught Error: Do not record this error',
        'Uncaught Error: ResizeObserver loop limit exceeded',
      ])
    );
  });
});
