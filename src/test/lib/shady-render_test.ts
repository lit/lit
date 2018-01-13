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

import {html, render} from '../../lib/shady-render.js';


/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />

const assert = chai.assert;

suite('shady-render', () => {

  test('prepares templates with ShadyCSS', () => {
    const container = document.createElement('div');
    render(html`
      <style>
        div {
          color: red;
        }
      </style>
      <div>Testing...</div>
    `, container, 'x-foo');
    assert.equal(container.children.length, 1);
    const div = container.firstElementChild!;
    assert.equal(div.getAttribute('class'), `style-scope x-foo`);
    const style = document.querySelector('style[scope="x-foo"]');
    assert.isNotNull(style);
  });

});
