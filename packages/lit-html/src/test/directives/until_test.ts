/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
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

import {until} from '../../directives/until.js';
import {html, render} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';
import {assert} from '@esm-bundle/chai';
import '../polyfills.js';

suite('until directive', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('renders a literal value', () => {
    render(html`${until('a')}`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), 'a');
  });
});
