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

import {unsafeHTML} from '../../lib/unsafe-html.js';
import {html, render} from '../../lit-html.js';

const assert = chai.assert;

suite('unsafeHTML', () => {

  test('renders HTML', () => {
    const container = document.createElement('div');
    render(
        html`<div>before${unsafeHTML('<span>inner</span>after</div>')}`,
        container);
    assert.equal(
        container.innerHTML, '<div>before<span>inner</span>after</div>');
  });

});
