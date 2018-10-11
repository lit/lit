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

/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />

import {cachingWhen} from '../../directives/caching-when.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

suite('when', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  suite('if mode', () => {
    function renderWhen(condition: any) {
      const template = html
      `${cachingWhen(condition, () => html`<div>Condition is true</div>`)}`;
      render(template, container);
    }

    test('renders the value if condition is true', () => {
      renderWhen(true);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div>Condition is true</div>');
    });

    test('does not render anything when condition is false', () => {
      renderWhen(false);
      assert.equal(stripExpressionMarkers(container.innerHTML), '');
    });

    test('clears container when switching from true to false', () => {
      renderWhen(true);
      renderWhen(false);
      assert.equal(stripExpressionMarkers(container.innerHTML), '');
    });

    test('caches templates between renders', () => {
      renderWhen(true);
      const trueEl = container.firstElementChild;

      renderWhen(false);

      renderWhen(true);
      assert.equal(trueEl, container.firstElementChild);
    });
  });

  suite('if/else mode', () => {
    function renderWhen(condition: any) {
      const template = html`${
          cachingWhen(
              condition,
              () => html`<div>Condition is true</div>`,
              () => html`<div>Condition is false</div>`)}`;
      render(template, container);
    }

    test('renders the value if condition is true', () => {
      renderWhen(true);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div>Condition is true</div>');
    });

    test('renders the value if condition is false', () => {
      renderWhen(false);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div>Condition is false</div>');
    });

    test('renders one condition at a time when switching conditions', () => {
      renderWhen(true);
      renderWhen(false);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div>Condition is false</div>');
    });

    test('caches templates between renders', () => {
      renderWhen(true);
      const trueEl = container.firstElementChild;

      renderWhen(false);
      const falseEl = container.firstElementChild;

      renderWhen(true);
      assert.equal(trueEl, container.firstElementChild);

      renderWhen(false);
      assert.equal(falseEl, container.firstElementChild);
    });
  });

  suite('switch mode mode', () => {
    suite('with default', () => {
      function renderWhen(condition: any) {
        const template = html`${cachingWhen(condition, {
          a: () => html`<div>Condition is a</div>`,
          b: () => html`<div>Condition is b</div>`,
          c: () => html`<div>Condition is c</div>`,
          default: () => html`<div>Condition is default</div>`
        })}`;
        render(template, container);
      }

      test('renders the matched case', () => {
        renderWhen('a');
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<div>Condition is a</div>');
      });

      test('renders the default case if no match', () => {
        renderWhen('foo');
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<div>Condition is default</div>');
      });

      test('renders one condition at a time when switching conditions', () => {
        renderWhen('a');
        renderWhen('b');
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<div>Condition is b</div>');
      });

      test('caches templates between renders', () => {
        renderWhen('a');
        const aEl = container.firstElementChild;

        renderWhen('b');
        const bEl = container.firstElementChild;

        renderWhen('foo');
        const defaultEl = container.firstElementChild;

        renderWhen('b');
        assert.equal(bEl, container.firstElementChild);

        renderWhen('foo');
        assert.equal(defaultEl, container.firstElementChild);

        renderWhen('a');
        assert.equal(aEl, container.firstElementChild);
      });
    });

    test('renders nothing if no match and no default condition', () => {
      const template = html`${cachingWhen('foo', {
        a: () => html`<div>Condition is a</div>`,
        b: () => html`<div>Condition is b</div>`
      })}`;

      render(template, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '');
    });
  });
});
