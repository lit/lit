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

import {html} from '../../lib/shady-render.js';
import {policy} from '../test-utils/security.js';
import {renderShadowRoot} from '../test-utils/shadow-root.js';

const assert = chai.assert;

suite('shady-render scoping shim', () => {
  setup(function() {
    if (typeof window.ShadyDOM === 'undefined' || !window.ShadyDOM.inUse ||
        typeof window.ShadyCSS === 'undefined' ||
        window.ShadyCSS.nativeShadow ||
        window.ShadyCSS.ScopingShim === undefined) {
      this.skip();
      return;
    }
  });

  let testName;

  testName = 'scoped styles are applied for non-TemplateResult values';
  test(testName, function() {
    const container = document.createElement('scope-1');
    window.ShadyCSS!.ScopingShim!.prepareAdoptedCssText(
        [':host { border-top: 2px solid black; }'], 'scope-1');
    document.body.appendChild(container);
    renderShadowRoot(undefined, container);
    assert.equal(
        getComputedStyle(container).getPropertyValue('border-top-width').trim(),
        '2px');
    document.body.removeChild(container);
  });

  testName = 'adopted CSS remains when rendering a TemplateResult after an ' +
      'initial non-TemplateResult';
  test(testName, function() {
    const container = document.createElement('scope-2');
    window.ShadyCSS!.ScopingShim!.prepareAdoptedCssText(
        [':host { border-top: 2px solid black; } button { font-size: 7px; } '],
        'scope-2');
    document.body.appendChild(container);
    renderShadowRoot(undefined, container);
    assert.equal(
        getComputedStyle(container).getPropertyValue('border-top-width').trim(),
        '2px');
    renderShadowRoot(html`<button>This is a button.</button>`, container);
    assert.equal(
        getComputedStyle(container).getPropertyValue('border-top-width').trim(),
        '2px');
    assert.equal(
        getComputedStyle(container.shadowRoot!.querySelector('button')!)
            .getPropertyValue('font-size')
            .trim(),
        '7px');
    document.body.removeChild(container);
  });

  testName = 'Styles inserted in the initial render through NodeParts are ' +
      'scoped.';
  test(testName, function() {
    const style = document.createElement('style');
    style.innerHTML = policy.createHTML(
        ':host { border-top: 2px solid black; } button { font-size: 7px; }');
    const container = document.createElement('scope-3');
    document.body.appendChild(container);
    renderShadowRoot(
        html`${style}<button>This is a button.</button>`, container);
    assert.equal(
        getComputedStyle(container).getPropertyValue('border-top-width').trim(),
        '2px');
    assert.equal(
        getComputedStyle(container.shadowRoot!.querySelector('button')!)
            .getPropertyValue('font-size')
            .trim(),
        '7px');
    document.body.removeChild(container);
  });
});
