/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

import {html, nothing, render} from '../../lit-html.js';
import {guard} from '../../directives/guard.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';
import {assert} from '@esm-bundle/chai';

/* eslint-disable @typescript-eslint/no-explicit-any */

suite('guard', () => {
  let container: HTMLDivElement;

  function renderGuarded(value: any, f: () => any) {
    render(html`<div>${guard(value, f)}</div>`, container);
  }

  setup(() => {
    container = document.createElement('div');
  });

  test('re-renders only on identity changes', () => {
    let callCount = 0;
    let renderCount = 0;

    const guardedTemplate = () => {
      callCount += 1;
      return html`Template ${renderCount}`;
    };

    renderCount += 1;
    renderGuarded('foo', guardedTemplate);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>Template 1</div>'
    );

    renderCount += 1;
    renderGuarded('foo', guardedTemplate);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>Template 1</div>'
    );

    renderCount += 1;
    renderGuarded('bar', guardedTemplate);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>Template 3</div>'
    );

    assert.equal(callCount, 2);
  });

  test('renders with undefined the first time', () => {
    let callCount = 0;
    let renderCount = 0;

    const guardedTemplate = () => {
      callCount += 1;
      return html`${renderCount}`;
    };

    renderCount += 1;
    renderGuarded(undefined, guardedTemplate);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>1</div>');

    renderCount += 1;
    renderGuarded(undefined, guardedTemplate);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>1</div>');

    assert.equal(callCount, 1);
  });

  test('renders with nothing the first time', () => {
    let callCount = 0;
    let renderCount = 0;

    const guardedTemplate = () => {
      callCount += 1;
      return html`${renderCount}`;
    };

    renderCount += 1;
    renderGuarded(nothing, guardedTemplate);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>1</div>');

    renderCount += 1;
    renderGuarded(nothing, guardedTemplate);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>1</div>');

    assert.equal(callCount, 1);
  });

  test('dirty checks array values', () => {
    let callCount = 0;
    let items = ['foo', 'bar'];

    const guardedTemplate = () => {
      callCount += 1;
      // prettier-ignore
      return html`<ul>${items.map((i) => html`<li>${i}</li>`)}</ul>`;
    };

    renderGuarded([items], guardedTemplate);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><ul><li>foo</li><li>bar</li></ul></div>'
    );

    items.push('baz');
    renderGuarded([items], guardedTemplate);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><ul><li>foo</li><li>bar</li></ul></div>'
    );

    items = [...items];
    renderGuarded([items], guardedTemplate);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><ul><li>foo</li><li>bar</li><li>baz</li></ul></div>'
    );

    assert.equal(callCount, 2);
  });

  test('dirty checks arrays of values', () => {
    let callCount = 0;
    const items = ['foo', 'bar'];

    const guardedTemplate = () => {
      callCount += 1;
      // prettier-ignore
      return html`<ul>${items.map((i) => html`<li>${i}</li>`)}</ul>`;
    };

    renderGuarded(items, guardedTemplate);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><ul><li>foo</li><li>bar</li></ul></div>'
    );

    renderGuarded(['foo', 'bar'], guardedTemplate);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><ul><li>foo</li><li>bar</li></ul></div>'
    );

    items.push('baz');
    renderGuarded(items, guardedTemplate);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><ul><li>foo</li><li>bar</li><li>baz</li></ul></div>'
    );

    assert.equal(callCount, 2);
  });
});
