/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {justText, until} from '../helpers.js';
import {expect} from '@open-wc/testing';

describe('justText', () => {
  it('strips tags', () => {
    expect(justText('<span>some text</span>')).to.equal('some text');
  });
  it('squeezes and trims white space', () => {
    expect(
      justText(`
      this
        will
          all
            be  on
              one    line.
    `)
    ).to.equal('this will all be on one line.');
  });
});

describe('justText', () => {
  it('strips tags', () => {
    expect(justText('<span>some text</span>')).to.equal('some text');
  });
  it('squeezes and trims white space', () => {
    expect(
      justText(`
      this
        will
          all
            be  on
              one    line.
    `)
    ).to.equal('this will all be on one line.');
  });
});

describe('until', () => {
  it('resolves when condition is met', async () => {
    let condition = false;
    setTimeout(() => (condition = true), 500);
    await until(() => condition);
    expect(condition).to.be.true;
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
