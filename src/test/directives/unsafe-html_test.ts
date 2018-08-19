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

import {unsafeHTML} from '../../directives/unsafe-html.js';
import {html} from '../../index.js';
import {render} from '../../lib/render.js';
import {stripExpressionDelimeters} from '../test-helpers.js';

const assert = chai.assert;

suite('unsafeHTML', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('renders HTML', () => {
    render(
        html`<div>before${unsafeHTML('<span>inner</span>after</div>')}`,
        container);
    assert.equal(
        stripExpressionDelimeters(container.innerHTML),
        '<div>before<span>inner</span>after</div>');
  });

  test('dirty checks primitive values', () => {
    const value = 'aaa';
    const t = () => html`<div>${unsafeHTML(value)}</div>`;

    // Initial render
    render(t(), container);
    assert.equal(
        stripExpressionDelimeters(container.innerHTML), '<div>aaa</div>');

    // Modify instance directly. Since lit-html doesn't dirty check against
    // actual DOM, but again previous part values, this modification should
    // persist through the next render if dirty checking works.
    const text = container.firstChild!.childNodes[1] as Text;
    text.textContent = 'bbb';
    assert.equal(
        stripExpressionDelimeters(container.innerHTML), '<div>bbb</div>');

    // Re-render with the same value
    render(t(), container);

    assert.equal(
        stripExpressionDelimeters(container.innerHTML), '<div>bbb</div>');
    const text2 = container.firstChild!.childNodes[1] as Text;
    assert.strictEqual(text, text2);
  });

  test('does not dirty check complex values', () => {
    const value = ['aaa'];
    const t = () => html`<div>${unsafeHTML(value)}</div>`;

    // Initial render
    render(t(), container);
    assert.equal(
        stripExpressionDelimeters(container.innerHTML), '<div>aaa</div>');

    // Re-render with the same value, but a different deep property
    value[0] = 'bbb';
    render(t(), container);
    assert.equal(
        stripExpressionDelimeters(container.innerHTML), '<div>bbb</div>');
  });
});
