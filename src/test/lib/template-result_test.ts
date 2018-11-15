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

import {marker} from '../../lib/template.js';
import {html} from '../../lit-html.js';

const assert = chai.assert;

const ua = window.navigator.userAgent;
const isIe = ua.indexOf('Trident/') > 0;
const testOnIE = isIe ? test : test.skip;

suite('TemplateResult', () => {
  test('strings are identical for multiple calls', () => {
    const t = () => html``;
    assert.strictEqual(t().strings, t().strings);
  });

  test('values contain interpolated values', () => {
    const foo = 'foo', bar = 1;
    assert.deepEqual(html`${foo}${bar}`.values, [foo, bar]);
  });

  testOnIE('style attributes are renamed on IE', () => {
    const templateHTML = html`<div style="color: ${'red'}"></div>`.getHTML();
    assert.equal(templateHTML, `<div style$="color: ${marker}"></div>`);
  });

  test('self-closing elements', () => {
    const templateHTML = html`<custom-element test="<3" />`.getHTML();
    assert.deepEqual(templateHTML, '<custom-element test="<3" ></custom-element>');
  });
});
