/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />

import {until} from '../../lib/until.js';
import {html, render} from '../../lit-html.js';

const assert = chai.assert;

suite('until', () => {

  test('displays defaultContent immediately', async () => {
    const container = document.createElement('div');
    let resolve: (v: any) => void;
    const promise = new Promise((res, _) => {
      resolve = res;
    });
    render(
        html`<div>${until(promise, html`<span>loading...</span>`)}</div>`,
        container);
    assert.equal(container.innerHTML, '<div><span>loading...</span></div>');
    resolve!('foo');
    await promise;
    await new Promise((r) => setTimeout(() => r()));
    assert.equal(container.innerHTML, '<div>foo</div>');
  });

});
