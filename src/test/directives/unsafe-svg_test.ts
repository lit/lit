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

import {unsafeSVG} from '../../directives/unsafe-svg.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

/* eslint-disable @typescript-eslint/no-explicit-any */

suite('unsafeSVG', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('renders SVG', () => {
    render(
        html`<svg>before${
            unsafeSVG(
                '<line x1="0" y1="0" x2="10" y2="10" stroke="black"/>')}</svg>`,
        container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<svg>before<line x1="0" y1="0" x2="10" y2="10" stroke="black"></line></svg>',
      '<svg>before<line stroke="black" x1="0" y1="0" x2="10" y2="10"></line></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg">before<line stroke="black" x1="0" y1="0" x2="10" y2="10" /></svg>'
    ]);
    const lineElement = container.querySelector('line')!;
    assert.equal(lineElement.namespaceURI, 'http://www.w3.org/2000/svg');
  });

  test('dirty checks primitive values', () => {
    const value = 'aaa';
    const t = () => html`<svg>${unsafeSVG(value)}</svg>`;

    // Initial render
    render(t(), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<svg>aaa</svg>',
      '<svg xmlns="http://www.w3.org/2000/svg">aaa</svg>',
    ]);

    // Modify instance directly. Since lit-html doesn't dirty check against
    // actual DOM, but against previous part values, this modification should
    // persist through the next render if dirty checking works.
    const text = container.querySelector('svg')!.childNodes[1] as Text;
    text.textContent = 'bbb';
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<svg>bbb</svg>',
      '<svg xmlns="http://www.w3.org/2000/svg">bbb</svg>',
    ]);

    // Re-render with the same value
    render(t(), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<svg>bbb</svg>',
      '<svg xmlns="http://www.w3.org/2000/svg">bbb</svg>',
    ]);
    const text2 = container.querySelector('svg')!.childNodes[1] as Text;
    assert.strictEqual(text, text2);
  });

  test('does not dirty check complex values', () => {
    const value = ['aaa'];
    const t = () => html`<svg>${unsafeSVG(value)}</svg>`;

    // Initial render
    render(t(), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<svg>aaa</svg>',
      '<svg xmlns="http://www.w3.org/2000/svg">aaa</svg>',
    ]);

    // Re-render with the same value, but a different deep property
    value[0] = 'bbb';
    render(t(), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<svg>bbb</svg>',
      '<svg xmlns="http://www.w3.org/2000/svg">bbb</svg>',
    ]);
  });

  test('renders after other values', () => {
    const value = '<text></text>';
    const primitive = 'aaa';
    const t = (content: any) => html`<svg>${content}</svg>`;

    // Initial unsafeSVG render
    render(t(unsafeSVG(value)), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<svg><text></text></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><text /></svg>',
    ]);

    // Re-render with a non-unsafeSVG value
    render(t(primitive), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<svg>aaa</svg>',
      '<svg xmlns="http://www.w3.org/2000/svg">aaa</svg>'
    ]);

    // Re-render with unsafeSVG again
    render(t(unsafeSVG(value)), container);
    assert.oneOf(stripExpressionMarkers(container.innerHTML), [
      '<svg><text></text></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><text /></svg>',
    ]);
  });
});
