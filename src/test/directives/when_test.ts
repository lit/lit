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

import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {when} from '../../directives/when.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

suite('when', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  suite('simple template', () => {
    function renderWhen(condition: boolean) {
      render(
        html`${when(condition, () => html`<div></div>`, () => html`<span></span>`)}`,
        container
      );
    }

    test('renders if/then template based on condition', () => {
      renderWhen(true);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      renderWhen(false);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<span></span>');

      renderWhen(true);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      renderWhen(true);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    });

    test('caches if/then templates', () => {
      renderWhen(true);
      const ifEl = container.firstElementChild;

      renderWhen(false);
      const elseEl = container.firstElementChild;

      renderWhen(true);
      assert.equal(ifEl, container.firstElementChild);

      renderWhen(false);
      assert.equal(elseEl, container.firstElementChild);
    });
  });

  suite('nested attribute part', () => {
    function renderWhen(condition: boolean, value: string) {
      render(
        html`${when(condition, () => html`<div foo="${value}"></div>`, () => html`<span foo="${value}"></span>`)}`,
        container
      );
    }

    test('updates attribute parts when switching conditions', () => {
      renderWhen(true, 'foo');
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div foo="foo"></div>');

      renderWhen(false, 'foo');
      assert.equal(stripExpressionMarkers(container.innerHTML), '<span foo="foo"></span>');

      renderWhen(true, 'bar');
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div foo="bar"></div>');

      renderWhen(false, 'bar');
      assert.equal(stripExpressionMarkers(container.innerHTML), '<span foo="bar"></span>');
    });
  });

  suite('nested template', () => {
    function renderWhen(condition: boolean, value: string) {
      const ifTemplate = () => html`<div>${html`<span>${value}</span>`}</div>`;
      const elseTemplate = () => html`<div>${html`<span>${value}</span>`}</div>`;

      render(
        html`${when(condition, ifTemplate, elseTemplate)}`,
        container
      );
    }

    test('updates template parts when switching conditions', () => {
      renderWhen(true, 'foo');
      const ifParent = container.firstElementChild!;
      assert.equal(ifParent.firstElementChild!.textContent, 'foo');

      renderWhen(false, 'foo');
      const elseParent = container.firstElementChild!;
      assert.equal(elseParent.firstElementChild!.textContent, 'foo');

      renderWhen(true, 'bar');
      assert.equal(ifParent.firstElementChild!.textContent, 'bar');
      assert.equal(ifParent.firstElementChild, container.firstElementChild!.firstElementChild);

      renderWhen(false, 'bar');
      assert.equal(elseParent.firstElementChild!.textContent, 'bar');
      assert.equal(elseParent.firstElementChild, container.firstElementChild!.firstElementChild);

      renderWhen(false, 'bar');
      assert.equal(elseParent.firstElementChild!.textContent, 'bar');
      assert.equal(elseParent.firstElementChild, container.firstElementChild!.firstElementChild);
    });
  });
});
