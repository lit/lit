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

import {templateContent} from '../../directives/template-content';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {policy} from '../test-utils/security';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

/* eslint-disable @typescript-eslint/no-explicit-any */

suite('templateContent', () => {
  let container: HTMLElement;
  const template = document.createElement('template');
  template.innerHTML = policy.createHTML('<div>aaa</div>');

  setup(() => {
    container = document.createElement('div');
  });

  test('renders a template', () => {
    render(html`<div>${templateContent(template)}</div>`, container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div><div>aaa</div></div>');
  });

  test('clones a template only once', () => {
    const go = () =>
        render(html`<div>${templateContent(template)}</div>`, container);
    go();
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div><div>aaa</div></div>');
    const templateDiv = container.querySelector('div > div') as HTMLDivElement;

    go();
    const templateDiv2 = container.querySelector('div > div') as HTMLDivElement;
    assert.equal(templateDiv, templateDiv2);
  });

  test('renders a new template over a previous one', () => {
    const go = (t: HTMLTemplateElement) =>
        render(html`<div>${templateContent(t)}</div>`, container);
    go(template);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div><div>aaa</div></div>');

    const newTemplate = document.createElement('template');
    newTemplate.innerHTML = policy.createHTML('<span>bbb</span>');
    go(newTemplate);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div><span>bbb</span></div>');
  });

  test('re-renders a template over a non-templateContent value', () => {
    const go = (v: unknown) => render(html`<div>${v}</div>`, container);
    go(templateContent(template));
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div><div>aaa</div></div>');

    go('ccc');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>ccc</div>');

    go(templateContent(template));
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div><div>aaa</div></div>');
  });
});
