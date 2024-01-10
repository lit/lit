/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';
import {render, html, nothing, noChange} from 'lit-html';
import {stripExpressionMarkers} from '@lit-labs/testing';
import {assert} from '@esm-bundle/chai';

suite('unsafeHTML directive', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('renders HTML', () => {
    render(
      html`<div>before${unsafeHTML('<span>inner</span>after')}</div>`,
      container
    );
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>before<span>inner</span>after</div>'
    );
  });

  test('rendering `nothing` renders empty string to content', () => {
    render(html`<div>before${unsafeHTML(nothing)}after</div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>beforeafter</div>'
    );
  });

  test('rendering `noChange` does not change the previous content', () => {
    const template = (v: string | typeof noChange) =>
      html`<div>before${unsafeHTML(v)}after</div>`;
    render(template('<p>Hi</p>'), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>before<p>Hi</p>after</div>'
    );
    render(template(noChange), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>before<p>Hi</p>after</div>'
    );
  });

  test('rendering `undefined` renders empty string to content', () => {
    render(html`<div>before${unsafeHTML(undefined)}after</div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>beforeafter</div>'
    );
  });

  test('rendering `null` renders empty string to content', () => {
    render(html`<div>before${unsafeHTML(null)}after</div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>beforeafter</div>'
    );
  });

  test('dirty checks primitive values', () => {
    const value = 'aaa';
    const t = () => html`<div>${unsafeHTML(value)}</div>`;

    // Initial render
    render(t(), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>aaa</div>');

    // Modify instance directly. Since lit-html doesn't dirty check against
    // actual DOM, but against previous part values, this modification should
    // persist through the next render if dirty checking works.
    const text = container.querySelector('div')!.childNodes[1] as Text;
    text.textContent = 'bbb';
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>bbb</div>',
      'A'
    );

    // Re-render with the same value
    render(t(), container);

    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>bbb</div>',
      'B'
    );
    const text2 = container.querySelector('div')!.childNodes[1] as Text;
    assert.strictEqual(text, text2);
  });

  test('throws on non-string values', () => {
    const value = ['aaa'];
    const t = () => html`<div>${unsafeHTML(value as any)}</div>`;
    assert.throws(() => render(t(), container));
  });

  test('renders after other values', () => {
    const value = '<span></span>';
    const primitive = 'aaa';
    const t = (content: any) => html`<div>${content}</div>`;

    // Initial unsafeHTML render
    render(t(unsafeHTML(value)), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><span></span></div>'
    );

    // Re-render with a non-unsafeHTML value
    render(t(primitive), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>aaa</div>');

    // Re-render with unsafeHTML again
    render(t(unsafeHTML(value)), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><span></span></div>'
    );
  });
});
