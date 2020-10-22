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
import {cache} from '../../directives/cache.js';
import {stripExpressionComments} from '../test-utils/strip-markers.js';
import {assert} from '@esm-bundle/chai';

suite('cache directive', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('caches templates', () => {
    const renderCached = (condition: any, v: string) =>
      render(
        html`${cache(
          condition ? html`<div v=${v}></div>` : html`<span v=${v}></span>`
        )}`,
        container
      );

    renderCached(true, 'A');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div v="A"></div>'
    );
    const element1 = container.firstElementChild;

    renderCached(false, 'B');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<span v="B"></span>'
    );
    const element2 = container.firstElementChild;

    assert.notStrictEqual(element1, element2);

    renderCached(true, 'C');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div v="C"></div>'
    );
    assert.strictEqual(container.firstElementChild, element1);

    renderCached(false, 'D');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<span v="D"></span>'
    );
    assert.strictEqual(container.firstElementChild, element2);
  });

  test('renders non-TemplateResults', () => {
    render(html`${cache('abc')}`, container);
    assert.equal(stripExpressionComments(container.innerHTML), 'abc');
  });

  test('caches templates when switching against non-TemplateResults', () => {
    const renderCached = (condition: any, v: string) =>
      render(
        html`${cache(condition ? html`<div v=${v}></div>` : v)}`,
        container
      );

    renderCached(true, 'A');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div v="A"></div>'
    );
    const element1 = container.firstElementChild;

    renderCached(false, 'B');
    assert.equal(stripExpressionComments(container.innerHTML), 'B');

    renderCached(true, 'C');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div v="C"></div>'
    );
    assert.strictEqual(container.firstElementChild, element1);

    renderCached(false, 'D');
    assert.equal(stripExpressionComments(container.innerHTML), 'D');
  });
});
