/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, nothing, render} from 'lit-html';
import {guard} from 'lit-html/directives/guard.js';
import {Directive, directive, PartInfo} from 'lit-html/directive.js';
import {stripExpressionMarkers} from '@lit-labs/testing';
import {assert} from '@esm-bundle/chai';

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

  test('guards directive from running', () => {
    let directiveRenderCount = 0;
    let directiveConstructedCount = 0;
    let renderCount = 0;

    class MyDirective extends Directive {
      constructor(partInfo: PartInfo) {
        super(partInfo);
        directiveConstructedCount++;
      }
      render() {
        directiveRenderCount++;
        return directiveRenderCount;
      }
    }
    const testDirective = directive(MyDirective);

    const guardedTemplate = () => {
      renderCount += 1;
      return testDirective();
    };

    renderGuarded('foo', guardedTemplate);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>1</div>');

    renderGuarded('foo', guardedTemplate);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>1</div>');

    renderGuarded('bar', guardedTemplate);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>2</div>');

    assert.equal(renderCount, 2);
    assert.equal(directiveConstructedCount, 1);
  });
});
