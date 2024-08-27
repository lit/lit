/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html} from 'lit-html';
import {makeAssertRender} from '../test-utils/assert-render.js';

import {join} from 'lit-html/directives/join.js';

suite('join', () => {
  let container: HTMLDivElement;

  const assertRender = makeAssertRender(() => container);

  setup(() => {
    container = document.createElement('div');
  });

  test('with array', () => {
    assertRender(join(['a', 'b', 'c'], ','), 'a,b,c');
  });

  test('with empty array', () => {
    assertRender(join([], ','), '');
  });

  test('with undefined', () => {
    assertRender(join(undefined, ','), '');
  });

  test('with iterable', () => {
    function* iterate<T>(items: Array<T>) {
      for (const i of items) {
        yield i;
      }
    }
    assertRender(join(iterate(['a', 'b', 'c']), ','), 'a,b,c');
  });

  test('passes index', () => {
    assertRender(
      join(['a', 'b', 'c'], (i) => html`<p>${i}</p>`),
      'a<p>0</p>b<p>1</p>c'
    );
  });
});
