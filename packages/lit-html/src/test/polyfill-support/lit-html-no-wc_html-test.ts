/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
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
import '../../polyfill-support.js';
import {html, render} from '../../lit-html.js';
import {assert} from '@esm-bundle/chai';
import {ShadyRenderOptions} from '../test-utils/shadow-root.js';

suite('shady-render without Shadow DOM or Custom Elements', () => {
  test('shady-render renders content', () => {
    const container = document.createElement('scope-1');
    document.body.appendChild(container);
    const result = html` <div>Rendered content.</div> `;
    render(result, container, {scope: 'scope-1'} as ShadyRenderOptions);
    const div = container.querySelector('div');
    assert.equal(div!.textContent, 'Rendered content.');
    document.body.removeChild(container);
  });
});
