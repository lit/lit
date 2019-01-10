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

import {ClassInfo, classMap} from '../../directives/class-map.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';

const assert = chai.assert;

suite('classMap', () => {
  let container: HTMLDivElement;

  function renderClassMap(cssInfo: ClassInfo) {
    render(html`<div class="${classMap(cssInfo)}"></div>`, container);
  }

  function renderClassMapStatic(cssInfo: ClassInfo) {
    render(html`<div class="aa ${classMap(cssInfo)}  bb "></div>`, container);
  }

  setup(() => {
    container = document.createElement('div');
  });

  test('adds classes', () => {
    renderClassMap({foo: 0, bar: true, zonk: true});
    const el = container.firstElementChild!;
    assert.isFalse(el.classList.contains('foo'));
    assert.isTrue(el.classList.contains('bar'));
    assert.isTrue(el.classList.contains('zonk'));
  });

  test('removes classes', () => {
    renderClassMap({foo: true, bar: true, baz: true});
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('foo'));
    assert.isTrue(el.classList.contains('bar'));
    assert.isTrue(el.classList.contains('baz'));
    renderClassMap({foo: false, bar: true, baz: false});
    assert.isFalse(el.classList.contains('foo'));
    assert.isTrue(el.classList.contains('bar'));
    assert.isFalse(el.classList.contains('baz'));
  });

  test('removes omitted classes', () => {
    renderClassMap({foo: true, bar: true, baz: true});
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('foo'));
    assert.isTrue(el.classList.contains('bar'));
    assert.isTrue(el.classList.contains('baz'));
    renderClassMap({});
    assert.isFalse(el.classList.contains('foo'));
    assert.isFalse(el.classList.contains('bar'));
    assert.isFalse(el.classList.contains('baz'));
    assert.equal(el.classList.length, 0);
  });

  test('works with static classes', () => {
    renderClassMapStatic({foo: true});
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('foo'));
    renderClassMapStatic({});
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isFalse(el.classList.contains('foo'));
  });

  test('throws when used on non-class attribute', () => {
    assert.throws(() => {
      render(html`<div id="${classMap({})}"></div>`, container);
    });
  });

  test('throws when used in attribute with more than 1 part', () => {
    assert.throws(() => {
      render(html`<div class="${'hi'} ${classMap({})}"></div>`, container);
    });
  });

  test('throws when used in NodePart', () => {
    assert.throws(() => {
      render(html`<div>${classMap({})}</div>`, container);
    });
  });
});
