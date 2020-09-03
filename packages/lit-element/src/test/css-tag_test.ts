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

import {css} from '../lib/css-tag.js';
import {assert} from '@esm-bundle/chai';

suite('Styling', () => {
  suite('css tag', () => {
    test('caches CSSResults with no expressions', () => {
      const makeStyle = () => css`foo`;
      const style1 = makeStyle();
      const style2 = makeStyle();
      assert.strictEqual(style1, style2);
    });

    test('caches CSSResults with same-valued expressions', () => {
      const makeStyle = () => css`foo ${1}`;
      const style1 = makeStyle();
      const style2 = makeStyle();
      assert.strictEqual(style1, style2);
    });

    test('does not cache CSSResults with diferent-valued expressions', () => {
      const makeStyle = (x: number) => css`foo ${x}`;
      const style1 = makeStyle(1);
      const style2 = makeStyle(2);
      assert.notStrictEqual(style1, style2);
    });
  });
});
