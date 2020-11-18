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
import {render} from '../lit-html.js';
import {html, unsafeStatic} from '../static.js';
import {assert} from '@esm-bundle/chai';
import {stripExpressionComments} from './test-utils/strip-markers.js';

suite('static', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('static text binding', () => {
    render(html`${unsafeStatic('<p>Hello</p>')}`, container);
    // If this were a dynamic binding, the tags would be escaped
    assert.equal(stripExpressionComments(container.innerHTML), '<p>Hello</p>');
  });

  test('static attribute binding', () => {
    render(html`<div class="${unsafeStatic('cool')}"></div>`, container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div class="cool"></div>'
    );
    // TODO: test that this is actually static. It's not currently possible with
    // the public API
  });

  test('static tag binding', () => {
    const tagName = unsafeStatic('div');
    render(html`<${tagName}>${'A'}</${tagName}>`, container);
    assert.equal(stripExpressionComments(container.innerHTML), '<div>A</div>');
  });

  test('static attribute name binding', () => {
    render(html`<div ${unsafeStatic('foo')}="${'bar'}"></div>`, container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div foo="bar"></div>'
    );

    render(html`<div x-${unsafeStatic('foo')}="${'bar'}"></div>`, container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div x-foo="bar"></div>'
    );
  });

  test('static attribute name binding', () => {
    render(
      html`<div ${unsafeStatic('foo')}="${unsafeStatic('bar')}"></div>`,
      container
    );
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div foo="bar"></div>'
    );
  });

  test('dynamic binding after static text binding', () => {
    render(html`${unsafeStatic('<p>Hello</p>')}${'<p>World</p>'}`, container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<p>Hello</p>&lt;p&gt;World&lt;/p&gt;'
    );

    // Make sure `null` is handled
    render(html`${unsafeStatic('<p>Hello</p>')}${null}`, container);
    assert.equal(stripExpressionComments(container.innerHTML), '<p>Hello</p>');
  });
});
