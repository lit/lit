/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html} from 'lit-html';
import {makeAssertRender} from '../test-utils/assert-render.js';

import {map} from 'lit-html/directives/map.js';

suite('map', () => {
  let container: HTMLDivElement;

  const assertRender = makeAssertRender(() => container);

  setup(() => {
    container = document.createElement('div');
  });
  test('with array', () => {
    assertRender(
      map(['a', 'b', 'c'], (v) => html`<p>${v}</p>`),
      '<p>a</p><p>b</p><p>c</p>'
    );
  });

  test('with empty array', () => {
    assertRender(
      map([], (v) => html`<p>${v}</p>`),
      ''
    );
  });

  test('with undefined', () => {
    assertRender(
      map(undefined, (v) => html`<p>${v}</p>`),
      ''
    );
  });

  test('with iterable', () => {
    function* iterate<T>(items: Array<T>) {
      for (const i of items) {
        yield i;
      }
    }
    assertRender(
      map(iterate(['a', 'b', 'c']), (v) => html`<p>${v}</p>`),
      '<p>a</p><p>b</p><p>c</p>'
    );
  });

  test('passes index', () => {
    assertRender(
      map(['a', 'b', 'c'], (v, i) => html`<p>${v}:${i}</p>`),
      '<p>a:0</p><p>b:1</p><p>c:2</p>'
    );
  });
});
