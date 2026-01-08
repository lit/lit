/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  array,
  first,
  deepEqual,
  last,
  ignoreBenignErrors,
  ignoreWindowErrors,
  pass,
  getRelativeRect,
  until,
} from '../helpers.js';
import {expect} from '@open-wc/testing';

describe('array', () => {
  it('creates an array with n items', () => {
    const items = array(10);
    expect(items).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe('first', () => {
  it('returns the first item of an array', () => {
    expect(first([1, 2, 3])).to.equal(1);
  });

  it('returns undefined from an empty array', () => {
    expect(first([])).to.be.undefined;
  });

  it('returns the only item from a single item array', () => {
    expect(first([1])).to.equal(1);
  });
});

describe('last', () => {
  it('returns the last item of an array', () => {
    expect(last([1, 2, 3])).to.equal(3);
  });

  it('returns undefined from an empty array', () => {
    expect(last([])).to.be.undefined;
  });

  it('returns the only item from a single item array', () => {
    expect(last([1])).to.equal(1);
  });
});

describe('ignoreBenignErrors', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  // Chrome
  it('ignores ResizeObserver loop limit exceeded error', async () => {
    let errorThrown = false;
    setTimeout(() => {
      errorThrown = true;
      throw new Error('ResizeObserver loop limit exceeded');
    }, 0);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(errorThrown).to.eq(true);
  });

  // Safari/WebKit
  it('ignores ResizeObserver loop completed with undelivered notifications error', async () => {
    let errorThrown = false;
    setTimeout(() => {
      errorThrown = true;
      throw new Error(
        'ResizeObserver loop completed with undelivered notifications.'
      );
    }, 0);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(errorThrown).to.eq(true);
  });

  describe('Nested ignoreWindowErrors', () => {
    // This ignoreWindowErrors setup is nested within the ignoreBenignErrors setup in the containing
    // describe block.  This is an expected configuration and should be handled correctly because of
    // ordering of hooks by Mocha.
    ignoreWindowErrors(beforeEach, afterEach, /APPLES|BANANAS/);

    // Note that if we put another ignoreWindowErrors here, its afterEach will be called out
    // of order and then the teardown will fail with an explicit error, since we need the
    // advised method to be torn down LIFO instead of FIFO.

    it('ignores APPLES error and BANANAS error and tears down in correct order', async () => {
      let applesErrorThrown = false;
      let bananasErrorThrown = false;
      setTimeout(() => {
        applesErrorThrown = true;
        throw new Error('APPLES');
      }, 0);
      setTimeout(() => {
        bananasErrorThrown = true;
        throw new Error('BANANAS');
      }, 0);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(applesErrorThrown).to.eq(true);
      expect(bananasErrorThrown).to.eq(true);
    });
  });
});

describe('pass', () => {
  it('returns immediately if there are no errors', async () => {
    let x = true;

    const result = await pass(() => (x = false));
    expect(x).to.equal(false);

    // This expectation just demonstrates we don't care what the
    // result is that is returned by this function-- i.e. not relying
    // on a truthy value.
    expect(result).to.be.false;
  });

  it('allows you to wait for an error-throwing Chai expectation to be true', async () => {
    const start = new Date().getTime();
    await pass(() => expect(start).to.be.lessThan(new Date().getTime() - 800));
  });

  it('rethrows the failed Chai expectation after timeout exceeded', async () => {
    let err;
    try {
      await pass(() => expect(true).to.be.false);
    } catch (e) {
      err = e;
    }
    expect(err).to.exist;
    expect((err as Error)!.message).to.be.eq('expected true to be false');
  });
});

describe('until', () => {
  it('resolves when condition is true', async () => {
    let condition = false;
    setTimeout(() => (condition = true), 100);
    await until(() => condition);
    expect(condition).to.be.true;
  });

  it('resolves when condition is truthy', async () => {
    let condition: string | undefined = '';
    setTimeout(() => (condition = 'truthy'), 100);
    await until(() => condition);
    expect(condition).to.eq('truthy');
  });

  it('throws an error if timeout exceeded', async () => {
    const condition = false;
    let error: Error;
    try {
      await until(() => condition);
    } catch (e) {
      error = e as Error;
    }
    expect(error!).to.exist;
    expect(error!.message).to.contain(
      'Condition not met within 1000ms: "() => condition"'
    );
    expect(error!.message).to.contain('at o.<anonymous>');
  });
});

describe('getRelativeRect', () => {
  it('returns adjusted descendant with coords offset by ancestor top/left', () => {
    const ancestor = {top: 100, left: 200, bottom: 300, right: 400};
    const descendant = {top: 175, left: 250, bottom: 250, right: 375};
    const relative = getRelativeRect(descendant, ancestor);
    expect(relative).to.deep.equal({
      top: 75,
      left: 50,
      bottom: 150,
      right: 175,
    });
  });
});

describe('deepEqual', () => {
  it('compares object properties', () => {
    expect(deepEqual({a: 1, b: 2}, {a: 1, b: 2})).to.be.true;
    expect(deepEqual({a: 1, b: 2}, {a: 1})).to.be.false;
    expect(deepEqual({a: 1}, {a: 2})).to.be.false;
  });
  it('compares deeply nested object properties', () => {
    expect(deepEqual({a: {b: {c: 1}}}, {a: {b: {c: 1}}})).to.be.true;
    expect(deepEqual({a: {b: {c: 1}}}, {a: {b: {c: 2}}})).to.be.false;
  });
  it('compares arrays of non-object values', () => {
    expect(deepEqual(1, 1, 1, 1, 1)).to.be.true;
    expect(deepEqual(1, 1, 1, 1, 2)).to.be.false;
  });
});
