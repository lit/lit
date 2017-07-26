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

import {html} from '../../lit-html.js';
import {renderExtendedTo} from '../../labs/lit-extended.js';

const assert = chai.assert;

suite('lit-extended', () => {
  suite('renderExtendedTo', () => {
    test('reuses an existing TemplateInstance when available', () => {
      const container = document.createElement('div');

      renderExtendedTo(html`<div>foo</div>`, container);
      renderExtendedTo(html`<div>bar</div>`, container);

      assert.equal(container.children.length, 1);
      assert.equal(container.children[0].textContent, 'bar');
    });
  });
});


