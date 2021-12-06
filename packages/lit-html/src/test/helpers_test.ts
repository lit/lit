/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html, render} from '../lit-html.js';
import {assert} from '@esm-bundle/chai';
import {stripExpressionComments} from './test-utils/strip-markers.js';

import {join, map, range, when} from '../helpers.js';

suite('template helpers', () => {
  let container: HTMLDivElement;

  const assertRender = (value: unknown, expected: string) => {
    render(value, container);
    return assert.equal(stripExpressionComments(container.innerHTML), expected);
  };

  setup(() => {
    container = document.createElement('div');
  });

  suite('when', () => {
    test('true case, without false case', () => {
      assertRender(
        when(true, () => html`X`),
        'X'
      );
    });

    test('true case, with false case', () => {
      assertRender(
        when(
          true,
          () => html`X`,
          () => html`Y`
        ),
        'X'
      );
    });

    test('false case', () => {
      assertRender(
        when(
          false,
          () => html`X`,
          () => html`Y`
        ),
        'Y'
      );
    });
  });

  suite('map', () => {
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

  suite('join', () => {
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

  suite('range', () => {
    test('positive end', () => {
      assert.deepEqual([...range(0)], []);
      assert.deepEqual([...range(3)], [0, 1, 2]);
    });

    test('start and end', () => {
      assert.deepEqual([...range(0, 3)], [0, 1, 2]);
      assert.deepEqual([...range(-1, 1)], [-1, 0]);
      assert.deepEqual([...range(-2, -1)], [-2]);
    });

    test('end < start', () => {
      assert.deepEqual([...range(2, 1)], []);
    });

    test('custom step', () => {
      assert.deepEqual([...range(0, 10, 3)], [0, 3, 6, 9]);
    });

    test('negative step', () => {
      assert.deepEqual([...range(0, -3, -1)], [0, -1, -2]);
    });
  });
});
