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

const assert = chai.assert;

declare global {
  interface Window {
    WarnCount: number;
  }
}

suite('shady-render', () => {
  test('warns if ShadyCSS version incorrect', function() {
    if (typeof window.ShadyCSS === 'undefined') {
      this.skip();
      return;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
    const result = html`
      <style>
        div {
          border: 1px solid red;
        }
      </style>
      <div>Testing...</div>
    `;
    render(result, container.shadowRoot as DocumentFragment, {
      scopeName: 'scope-4'
    });
    assert.isAbove(window.WarnCount, 0);
    document.body.removeChild(container);
  });
});
