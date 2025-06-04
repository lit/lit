/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {
  createDocumentFragment,
  createCommentNode,
  createTextNode,
  createElement,
  createLitHtmlExpression,
  DocumentFragment,
  CommentNode,
  TextNode,
  Element,
  LitHtmlExpression,
} from '../../../lib/ast/html-parser/parse5-shim.js';

suite('parse5-shim', () => {
  test('createDocumentFragment creates a document fragment', () => {
    const fragment: DocumentFragment = createDocumentFragment();
    assert.equal(fragment.childNodes.length, 0);
  });

  test('createCommentNode creates a comment node', () => {
    const comment: CommentNode = createCommentNode();
    assert.equal(comment.data.length, 0);
    assert.equal(comment.parentNode, null);
  });

  test('createTextNode creates a text node with value', () => {
    const text: TextNode = createTextNode('test text');
    assert.equal(text.value, 'test text');
    assert.equal(text.parentNode, null);
  });

  test('createElement creates an element with tagName', () => {
    const div: Element = createElement('div');
    assert.equal(String(div.tagName), 'div');
    assert.equal(String(div.nodeName), 'div');
    assert.equal(div.parentNode, null);
    assert.equal(div.childNodes.length, 0);
    assert.equal(div.attrs.length, 0);
  });

  test('createElement creates an element with attributes', () => {
    const div: Element = createElement('div', {id: 'test', class: 'foo'});
    assert.equal(div.attrs.length, 2);
    // Note: The actual attribute objects are complex and implementation-specific
    // so we're just checking that attributes were added
  });

  test('createLitHtmlExpression creates a lit expression', () => {
    const value = {
      foo: 'bar',
      litHtmlExpression: null as unknown as LitHtmlExpression,
    };
    const element: Element = createElement('div');
    const expr: LitHtmlExpression = createLitHtmlExpression(value, 10, element);

    assert.equal(expr.nodeName, '#lit-html-expression');
    assert.equal(expr.type, 'LitHtmlExpression');
    assert.equal(expr.value, value);
    assert.equal(expr.element, element);
    assert.deepEqual(expr.sourceCodeLocation, {
      startOffset: 10,
      endOffset: 10,
    });

    // Check that the value has a reference back to the expression
    assert.equal(value.litHtmlExpression, expr);
  });

  test('createLitHtmlExpression works without element', () => {
    const value = {
      foo: 'bar',
      litHtmlExpression: null as unknown as LitHtmlExpression,
    };
    const expr: LitHtmlExpression = createLitHtmlExpression(value, 10);

    assert.equal(expr.nodeName, '#lit-html-expression');
    assert.equal(expr.type, 'LitHtmlExpression');
    assert.equal(expr.value, value);
    assert.isUndefined(expr.element);
    assert.deepEqual(expr.sourceCodeLocation, {
      startOffset: 10,
      endOffset: 10,
    });

    // Check that the value has a reference back to the expression
    assert.equal(value.litHtmlExpression, expr);
  });
});
