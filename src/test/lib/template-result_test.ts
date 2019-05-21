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

import {TemplateResult} from '../../lib/shady-render.js';
import {marker} from '../../lib/template.js';
import {html} from '../../lit-html.js';

const assert = chai.assert;

suite('TemplateResult', () => {
  test('strings are identical for multiple calls', () => {
    const t = () => html``;
    assert.strictEqual(t().strings, t().strings);
  });

  test('values contain interpolated values', () => {
    const foo = 'foo', bar = 1;
    assert.deepEqual(html`${foo}${bar}`.values, [foo, bar]);
  });

  test('style attributes are renamed', () => {
    const templateHTML = html`<div style="color: ${'red'}"></div>`.getHTML();
    assert.equal(templateHTML, `<div style$lit$="color: ${marker}"></div>`);
  });

  test('invalid escape sequences always throw an error', () => {
    function throws(template: TemplateResult) {
      assert.throw(() => template.getHTML());
    }

    throws(html`<style> .foo:before { content: "\0025a0"; } </style>`);
    throws(html`\0025a0${'bar'}\0025a0`);
    throws(html`\0025a0${'bar'}foo`);
    throws(html`foo${'foo'}\0025a0`);
  });
});
