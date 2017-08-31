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

/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />

import {repeat} from '../../lib/repeat.js';
import {html, render} from '../../lit-html.js';

const assert = chai.assert;

suite('repeat', () => {

  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  suite('keyed', () => {

    test('renders a list', () => {
      const r =
          html`${repeat([1, 2, 3], (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(r, container);
      assert.equal(
          container.innerHTML,
          `<li>item: 1</li><li>item: 2</li><li>item: 3</li>`);
    });

    test('shuffles are stable', () => {
      let items = [1, 2, 3];
      const t = () =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(t(), container);
      assert.equal(
          container.innerHTML,
          `<li>item: 1</li><li>item: 2</li><li>item: 3</li>`);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [3, 2, 1];
      render(t(), container);
      assert.equal(
          container.innerHTML,
          `<li>item: 3</li><li>item: 2</li><li>item: 1</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));
      assert.strictEqual(children1[0], children2[2]);
      assert.strictEqual(children1[1], children2[1]);
      assert.strictEqual(children1[2], children2[0]);
    });

    test('can insert an item at the beginning', () => {
      let items = [1, 2, 3];
      const t = () =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      items = [0, 1, 2, 3];
      render(t(), container);
      assert.equal(
          container.innerHTML,
          `<li>item: 0</li><li>item: 1</li><li>item: 2</li><li>item: 3</li>`);
    });

    test('can insert an item at the end', () => {
      let items = [1, 2, 3];
      const t = () =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      items = [1, 2, 3, 4];
      render(t(), container);
      assert.equal(
          container.innerHTML,
          `<li>item: 1</li><li>item: 2</li><li>item: 3</li><li>item: 4</li>`);
    });

    test('can replace with an empty list', () => {
      let items = [1, 2, 3];
      const t = () =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      items = [];
      render(t(), container);
      assert.equal(container.innerHTML, ``);
    });

    test('can remove the first item', () => {
      let items = [1, 2, 3];
      const t = () =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [2, 3];
      render(t(), container);
      assert.equal(container.innerHTML, `<li>item: 2</li><li>item: 3</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));
      assert.strictEqual(children1[1], children2[0]);
      assert.strictEqual(children1[2], children2[1]);
    });

    test('can remove the last item', () => {
      let items = [1, 2, 3];
      const t = () =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [1, 2];
      render(t(), container);
      assert.equal(container.innerHTML, `<li>item: 1</li><li>item: 2</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));
      assert.strictEqual(children1[0], children2[0]);
      assert.strictEqual(children1[1], children2[1]);
    });

    test('can remove a middle item', () => {
      let items = [1, 2, 3];
      const t = () =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [1, 3];
      render(t(), container);
      assert.equal(container.innerHTML, `<li>item: 1</li><li>item: 3</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));
      assert.strictEqual(children1[0], children2[0]);
      assert.strictEqual(children1[2], children2[1]);
    });

  });

  suite('un-keyed', () => {

    test('renderes an list', () => {
      const r = html`${repeat([1, 2, 3], (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(r, container);
      assert.equal(
          container.innerHTML,
          `<li>item: 1</li><li>item: 2</li><li>item: 3</li>`);
    });

    test('shuffles a list', () => {
      let items = [1, 2, 3];
      const t = () => html`${repeat(items, (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(t(), container);
      assert.equal(
          container.innerHTML,
          `<li>item: 1</li><li>item: 2</li><li>item: 3</li>`);

      items = [3, 2, 1];
      render(t(), container);
      assert.equal(
          container.innerHTML,
          `<li>item: 3</li><li>item: 2</li><li>item: 1</li>`);
    });

    test('can replace with an empty list', () => {
      let items = [1, 2, 3];
      const t = () => html`${repeat(items, (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(t(), container);

      items = [];
      render(t(), container);
      assert.equal(container.innerHTML, ``);
    });

  });

});
