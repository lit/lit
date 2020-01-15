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

import {unsafeSVG} from '../../directives/unsafe-svg.js';
import {render} from '../../lib/render.js';
import {svg} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

// tslint:disable:no-any OK in test code.

suite('unsafeSVG', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('renders SVG with single child', () => {
    render(svg`<svg>${unsafeSVG('<g>inner</g>')}</svg>`, container);
    const produced = stripExpressionMarkers(container.innerHTML);
    assert.equal(produced, '<svg><g>inner</g></svg>');
    const svgElement = container.firstElementChild!;
    assert.equal(svgElement.tagName, 'svg');
    assert.equal(svgElement.namespaceURI, 'http://www.w3.org/2000/svg');
    const gElement = svgElement.firstElementChild!;
    assert.equal(gElement.tagName, 'g');
    assert.equal(gElement.namespaceURI, 'http://www.w3.org/2000/svg');
  });

  test('renders SVG with multiple children', () => {
    render(
        svg`<svg>before${unsafeSVG('<image>inner</image><g>after</g>')}</svg>`,
        container);
    const produced = stripExpressionMarkers(container.innerHTML);
    assert.equal(produced, '<svg>before<image>inner</image><g>after</g></svg>');
    const svgElement = container.firstElementChild!;
    assert.equal(svgElement.tagName, 'svg');
    assert.equal(svgElement.namespaceURI, 'http://www.w3.org/2000/svg');
    const imageElement = svgElement.firstElementChild!;
    assert.equal(imageElement.tagName, 'image');
    assert.equal(imageElement.namespaceURI, 'http://www.w3.org/2000/svg');
  });

  test('dirty checks primitive values', () => {
    const value = 'aaa';
    const t = () => svg`<svg>${unsafeSVG(value)}</svg>`;

    // Initial render
    render(t(), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<svg>aaa</svg>');

    // Modify instance directly. Since lit-html doesn't dirty check against
    // actual DOM, but again previous part values, this modification should
    // persist through the next render if dirty checking works.
    const text = container.querySelector('svg')!.childNodes[1] as Text;
    text.textContent = 'bbb';
    assert.equal(stripExpressionMarkers(container.innerHTML), '<svg>bbb</svg>');

    // Re-render with the same value
    render(t(), container);

    assert.equal(stripExpressionMarkers(container.innerHTML), '<svg>bbb</svg>');
    const text2 = container.querySelector('svg')!.childNodes[1] as Text;
    assert.strictEqual(text, text2);
  });

  test('does not dirty check complex values', () => {
    const value = ['aaa'];
    const t = () => svg`<svg>${unsafeSVG(value)}</svg>`;

    // Initial render
    render(t(), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<svg>aaa</svg>');

    // Re-render with the same value, but a different deep property
    value[0] = 'bbb';
    render(t(), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<svg>bbb</svg>');
  });

  test('renders after other values', () => {
    const value = '<g></g>';
    const primitive = 'aaa';
    const t = (content: any) => svg`<svg>${content}</svg>`;

    // Initial unsafeSVG render
    render(t(unsafeSVG(value)), container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<svg><g></g></svg>');

    // Re-render with a non-unsafeSVG value
    render(t(primitive), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<svg>aaa</svg>');

    // Re-render with unsafeSVG again
    render(t(unsafeSVG(value)), container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<svg><g></g></svg>');
  });
});
