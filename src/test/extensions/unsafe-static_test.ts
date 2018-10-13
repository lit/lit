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
import {html, render} from '../../lit-html.js';
import {unsafeStatic, withUnsafeStatic} from '../../extensions/unsafe-static.js';

const assert = chai.assert;
const expect = chai.expect;

suite('UnsafeStatic', () => {
  let container: HTMLElement;
  let staticHtml: typeof html;

  setup(() => {
    container = document.createElement('div');
    staticHtml = withUnsafeStatic(html);
  });

  test('renders static values into template', () => {
    const tag = unsafeStatic('div');
    const cls = unsafeStatic('class');
    const template = staticHtml`<${tag} ${cls}="test"></${tag}>`;
    render(template, container);

    assert(container.innerHTML, '<div class="test"></div>');
  });

  test('handles nesting', () => {
    const div = unsafeStatic('div');
    const span = unsafeStatic('span');
    const cls = unsafeStatic('class');
    const template = staticHtml`<${div}><${span} ${cls}="test">Test</${span}></${div}>`;
    render(template, container);

    assert(container.innerHTML, '<div><span class="test">Test</span></div>');
  });

  test('throws an error if static value is changed to dynamic', () => {
    let text: any = unsafeStatic('Test');
    const template = () => staticHtml`<div>${text}</div>`;
    render(template(), container);

    text = 'New Test';

    expect(() => render(template(), container)).to.throw();
  });

  test('ignores if one static value is changed to another', () => {
    let text = unsafeStatic('Test');
    const template = () => staticHtml`<div>${text}</div>`;
    render(template(), container);

    text = unsafeStatic('New Test');
    render(template(), container);

    assert(container.innerHTML, '<div>Test</div>');
  });
});
