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

import {renderShadowRoot} from '../test-utils/shadow-root.js';

const assert = chai.assert;

suite('shady-render scoping shim', () => {
  test('scoped styles are applied for non-TemplateResult values', function() {
    if (typeof window.ShadyDOM === 'undefined' || !window.ShadyDOM.inUse) {
      this.skip();
      return;
    }
    if (typeof window.ShadyCSS === 'undefined' ||
        window.ShadyCSS.nativeShadow ||
        window.ShadyCSS.ScopingShim === undefined) {
      this.skip();
      return;
    }
    const container = document.createElement('scope-1');
    window.ShadyCSS.ScopingShim.prepareAdoptedCssText(
        [':host { border-top: 2px solid black; }'], 'scope-1');
    document.body.appendChild(container);
    renderShadowRoot(undefined, container);
    assert.equal(
        getComputedStyle(container).getPropertyValue('border-top-width').trim(),
        '2px');
    document.body.removeChild(container);
  });
});
