/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {render} from 'lit-html';
import {html, literal, unsafeStatic} from 'lit-html/static.js';
import {assert} from '@esm-bundle/chai';
import {stripExpressionComments} from '@lit-labs/testing';

suite('static', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('static text binding', () => {
    render(html`${literal`<p>Hello</p>`}`, container);
    // If this were a dynamic binding, the tags would be escaped
    assert.equal(stripExpressionComments(container.innerHTML), '<p>Hello</p>');
  });

  test('static attribute binding', () => {
    render(html`<div class="${literal`cool`}"></div>`, container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div class="cool"></div>'
    );
    // TODO: test that this is actually static. It's not currently possible with
    // the public API
  });

  test('static tag binding', () => {
    const tagName = literal`div`;
    render(html`<${tagName}>${'A'}</${tagName}>`, container);
    assert.equal(stripExpressionComments(container.innerHTML), '<div>A</div>');
  });

  test('static attribute name binding', () => {
    render(html`<div ${literal`foo`}="${'bar'}"></div>`, container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div foo="bar"></div>'
    );

    render(html`<div x-${literal`foo`}="${'bar'}"></div>`, container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div x-foo="bar"></div>'
    );
  });

  test('static attribute name binding', () => {
    render(html`<div ${literal`foo`}="${literal`bar`}"></div>`, container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div foo="bar"></div>'
    );
  });

  test('dynamic binding after static text binding', () => {
    render(html`${literal`<p>Hello</p>`}${'<p>World</p>'}`, container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<p>Hello</p>&lt;p&gt;World&lt;/p&gt;'
    );

    // Make sure `null` is handled
    render(html`${literal`<p>Hello</p>`}${null}`, container);
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
    assert.isNotNull(div);

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
    const span = container.querySelector('span');
    assert.isNotNull(span);

    render(t('span', 'def'), container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<span>def</span>'
    );
    const span2 = container.querySelector('span');
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

  test('interpolating statics into statics', () => {
    const start = literal`<${literal`sp${literal`an`}`}>`;
    const end = literal`</${unsafeStatic('span')}>`;
    render(html`<div>a${start}b${end}c</div>`, container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div>a<span>b</span>c</div>'
    );
  });

  test('interpolating non-statics into statics throws', () => {
    assert.throws(() => {
      literal`a${literal`bar`}b${'shouldthrow'}`;
    });
  });

  suite('unsafe', () => {
    test('static tag binding', () => {
      const tagName = unsafeStatic('div');
      render(html`<${tagName}>${'A'}</${tagName}>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>A</div>'
      );
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
  });

  test(`don't render simple spoofed static values`, () => {
    const spoof = {
      ['_$staticValue$']: 'foo',
      r: {},
    };
    const template = html`<div>${spoof}</div>`;
    render(template, container);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div>[object Object]</div>'
    );
  });

  test('static html should not add value for consumed static expression', () => {
    const tagName = literal`div`;
    const template = html`<${tagName}>${'foo'}</${tagName}>`;
    assert.equal(template.values.length, 1);
    const template2 = html`<${tagName}>${'foo'}</${tagName}>${'bar'}`;
    assert.equal(template2.values.length, 2);
  });
});
