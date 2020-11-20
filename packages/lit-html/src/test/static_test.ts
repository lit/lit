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

  test('static bindings are keyed by static values', () => {
    // A template with a bound tag name. We should be able to re-render
    // this template with different tag names and have the tag names update.
    // New tag names will act as different templates.
    const t = (tag: string, text: string) =>
      html`<${unsafeStatic(tag)}>${text}</${unsafeStatic(tag)}>`;

    render(t('div', 'abc'), container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div>abc</div>'
    );
    const div = container.querySelector('div');

    render(t('div', 'def'), container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div>def</div>'
    );
    const div2 = container.querySelector('div');
    // Static values are stable between renders like static template strings
    assert.strictEqual(div2, div);

    render(t('span', 'abc'), container);
    // Rendering with a new static value should work, though it re-renders
    // since we have a new template.
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<span>abc</span>'
    );
    const span = container.querySelector('div');

    render(t('span', 'def'), container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<span>def</span>'
    );
    const span2 = container.querySelector('div');
    assert.strictEqual(span2, span);

    render(t('div', 'abc'), container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div>abc</div>'
    );
    const div3 = container.querySelector('div');
    // Static values do not have any caching behavior. Re-rendering with a
    // previously used value does not restore static DOM
    assert.notStrictEqual(div3, div);
  });
});
