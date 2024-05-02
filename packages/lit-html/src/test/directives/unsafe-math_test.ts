/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {unsafeMath} from 'lit-html/directives/unsafe-math.js';
import {render, html, nothing, noChange} from 'lit-html';
import {stripExpressionMarkers} from '@lit-labs/testing';
import {assert} from '@esm-bundle/chai';

suite('unsafeMath', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('renders MathML', () => {
    render(
      // prettier-ignore
      html`<math>${unsafeMath(
          '<mi>x</mi>'
        )}</math>`,
      container,
    );
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<math><mi>x</mi></math>',
      '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math>',
    ]);
    const miElement = container.querySelector('mi')!;
    assert.equal(miElement.namespaceURI, 'http://www.w3.org/1998/Math/MathML');
  });

  test('rendering `nothing` renders empty string to content', () => {
    render(html`<math>before${unsafeMath(nothing)}after</math>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<math>beforeafter</math>',
    );
  });

  test('rendering `noChange` does not change the previous content', () => {
    const template = (v: string | typeof noChange) =>
      html`<math>before${unsafeMath(v)}after</math>`;
    render(template('<mi>Hi</mi>'), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<math>before<mi>Hi</mi>after</math>',
    );
    render(template(noChange), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<math>before<mi>Hi</mi>after</math>',
    );
  });

  test('rendering `undefined` renders empty string to content', () => {
    render(html`<math>before${unsafeMath(undefined)}after</math>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<math>beforeafter</math>',
    );
  });

  test('rendering `null` renders empty string to content', () => {
    render(html`<math>before${unsafeMath(null)}after</math>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<math>beforeafter</math>',
    );
  });

  test('dirty checks primitive values', () => {
    const value = 'aaa';
    const t = () => html`<math>${unsafeMath(value)}</math>`;

    // Initial render
    render(t(), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<math>aaa</math>',
      '<math xmlns="http://www.w3.org/1998/Math/MathML">aaa</math>',
    ]);

    // Modify instance directly. Since lit-html doesn't dirty check against
    // actual DOM, but against previous part values, this modification should
    // persist through the next render if dirty checking works.
    const text = container.querySelector('math')!.childNodes[1] as Text;
    text.textContent = 'bbb';
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<math>bbb</math>',
      '<math xmlns="http://www.w3.org/1998/Math/MathML">bbb</math>',
    ]);

    // Re-render with the same value
    render(t(), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<math>bbb</math>',
      '<math xmlns="http://www.w3.org/1998/Math/MathML">bbb</math>',
    ]);
    const text2 = container.querySelector('math')!.childNodes[1] as Text;
    assert.strictEqual(text, text2);
  });

  test('throws on non-string values', () => {
    const value = ['aaa'];
    const t = () => html`<div>${unsafeMath(value as any)}</div>`;
    assert.throws(() => render(t(), container));
  });

  test('renders after other values', () => {
    const value = '<mi>x</mi>';
    const primitive = 'aaa';
    const t = (content: any) => html`<math>${content}</math>`;

    // Initial unsafeMath render
    render(t(unsafeMath(value)), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<math><mi>x</mi></math>',
      '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math>',
    ]);

    // Re-render with a non-unsafemath value
    render(t(primitive), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<math>aaa</math>',
      '<math xmlns="http://www.w3.org/1998/Math/MathML">aaa</math>',
    ]);

    // Re-render with unsafemath again
    render(t(unsafeMath(value)), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<math><mi></mi></math>',
      '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi /></math>',
    ]);
  });
});
