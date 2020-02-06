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

/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />

import {live} from '../../directives/live.js';
import {render} from '../../lib/render.js';
import {html, svg} from '../../lit-html.js';

const assert = chai.assert;

/* eslint-disable @typescript-eslint/no-explicit-any */

class LiveTester extends HTMLElement {
  _x?: string;
  _setCount = 0;

  get x(): string|undefined {
    return this._x;
  }

  set x(v: string|undefined) {
    this._x = v;
    this._setCount++;
  }
}
customElements.define('live-tester', LiveTester);

suite('live', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  suite('properties', () => {
    test('live() is useful', () => {
      const go = (x: string) => render(html`<input .value="${x}">}`, container);
      go('a');
      const el = container.firstElementChild as HTMLInputElement;
      el.value = 'b';
      go('a');
      assert.equal(el.value, 'b');
    });

    test('updates an externally set property', () => {
      const go = (x: string) =>
          render(html`<input .value="${live(x)}">}`, container);
      go('a');
      const el = container.firstElementChild as HTMLInputElement;
      el.value = 'b';
      go('a');
      assert.equal(el.value, 'a');
    });

    test('does not set a non-changed property', () => {
      const go = (x: string) =>
          render(html`<live-tester .x="${live(x)}"></live-tester>}`, container);
      go('a');
      const el = container.firstElementChild as LiveTester;
      assert.equal(el.x, 'a');
      assert.equal(el._setCount, 1);
      go('a');
      assert.equal(el.x, 'a');
      assert.equal(el._setCount, 1);
    });
  });

  suite('attributes', () => {
    test('updates an externally set attribute', () => {
      const go = (x: string) =>
          render(html`<div class="${live(x)}">}`, container);
      go('a');
      const el = container.firstElementChild as HTMLDivElement;
      el.className = 'b'
      go('a');
      assert.equal(el.getAttribute('class'), 'a');
    });

    test('does not set a non-changed attribute', async () => {
      let mutationCount = 0;
      const observer = new MutationObserver((records) => {
        mutationCount += records.length;
      });
      const go = (x: string) =>
          render(html`<div x="${live(x)}"></div>}`, container);
      go('a');
      const el = container.firstElementChild as LiveTester;
      assert.equal(el.getAttribute('x'), 'a');

      observer.observe(el, {attributes: true});

      go('b');
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(el.getAttribute('x'), 'b');
      assert.equal(mutationCount, 1);

      go('b');
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(el.getAttribute('x'), 'b');
      assert.equal(mutationCount, 1);
    });

    test('updates an externally set namespaced attribute', () => {
      const go = (x: string) =>
          render(svg`<use xlink:href="${live(x)}">}`, container);
      go('a');
      const el = container.firstElementChild as HTMLDivElement;
      assert.equal(
          el.getAttributeNS('http://www.w3.org/1999/xlink', 'href'), 'a');

      el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'b');
      go('a');
      assert.equal(
          el.getAttributeNS('http://www.w3.org/1999/xlink', 'href'), 'a');
    });
  });

  test(
      'does not set a non-changed attribute with a non-string value',
      async () => {
        let mutationCount = 0;
        const observer = new MutationObserver((records) => {
          mutationCount += records.length;
        });
        const go = (x: number) =>
            render(html`<div x="${live(x)}"></div>}`, container);
        go(1);
        const el = container.firstElementChild as LiveTester;
        assert.equal(el.getAttribute('x'), '1');

        observer.observe(el, {attributes: true});

        go(2);
        await new Promise((resolve) => setTimeout(resolve, 0));
        assert.equal(el.getAttribute('x'), '2');
        assert.equal(mutationCount, 1);

        go(2);
        await new Promise((resolve) => setTimeout(resolve, 0));
        assert.equal(el.getAttribute('x'), '2');
        assert.equal(mutationCount, 1);
      });

  suite('boolean attributes', () => {
    test('updates an externally set boolean attribute', () => {
      const go = (x: boolean) =>
          render(html`<div ?hidden="${live(x)}"></div>}`, container);

      go(true);
      const el = container.firstElementChild as HTMLDivElement;
      assert.equal(el.getAttribute('hidden'), '');

      go(true);
      assert.equal(el.getAttribute('hidden'), '');

      el.removeAttribute('hidden');
      assert.equal(el.getAttribute('hidden'), null);

      go(true);
      assert.equal(el.getAttribute('hidden'), '');
    });

    test('does not set a non-changed boolean attribute', async () => {
      let mutationCount = 0;
      const observer = new MutationObserver((records) => {
        mutationCount += records.length;
      });
      const go = (x: boolean) =>
          render(html`<div ?hidden="${live(x)}"></div>}`, container);

      go(true);
      const el = container.firstElementChild as LiveTester;
      assert.equal(el.getAttribute('hidden'), '');

      observer.observe(el, {attributes: true});

      go(false);
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(el.getAttribute('hidden'), null);
      assert.equal(mutationCount, 1);

      go(false);
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(el.getAttribute('hidden'), null);
      assert.equal(mutationCount, 1);
    });

    test('updates an externally set namespaced boolean attribute', () => {
      const go = (x: string) =>
          render(svg`<use ?xlink:href="${live(x)}" />}`, container);

      go('a');
      const el = container.firstElementChild as SVGUseElement;
      assert.equal(
          el.getAttributeNS('http://www.w3.org/1999/xlink', 'href'), 'a');

      go('b');
      assert.equal(
          el.getAttributeNS('http://www.w3.org/1999/xlink', 'href'), 'b');

      el.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      // EdgeHTML returns '' when xlink:href is removed?
      assert.include(
          [null, ''],
          el.getAttributeNS('http://www.w3.org/1999/xlink', 'href'));

      go('b');
      assert.equal(
          el.getAttributeNS('http://www.w3.org/1999/xlink', 'href'), 'b');
    });
  });
});
