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

import {html, svg} from '../index.js';
import {SVGTemplateResult, TemplateResult} from '../lib/template-result.js';

const assert = chai.assert;

suite('index.js', () => {
  test('html tag returns a TemplateResult', () => {
    assert.instanceOf(html``, TemplateResult);
  });

  test('svg tag returns a SVGTemplateResult', () => {
    assert.instanceOf(svg``, SVGTemplateResult);
  });
});
