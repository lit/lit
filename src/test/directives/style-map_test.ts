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

import {StyleInfo, styleMap} from '../../directives/style-map.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';

const ua = window.navigator.userAgent;
const isChrome41 = ua.indexOf('Chrome/41') > 0;
const isIE = ua.indexOf('Trident/') > 0;
const testIfSupportsCSSVariables = isIE || isChrome41 ? test.skip : test;

const assert = chai.assert;

// tslint:disable:no-any OK in test code.

suite('styleMap', () => {
  let container: HTMLDivElement;

  function renderStyleMap(cssInfo: StyleInfo) {
    render(html`<div style="${styleMap(cssInfo)}"></div>`, container);
  }

  function renderStyleMapStatic(cssInfo: StyleInfo) {
    render(
        html`<div style="height: 1px; ${styleMap(cssInfo)} color: red"></div>`,
        container);
  }

  setup(() => {
    container = document.createElement('div');
  });

  test('adds and updates properties', () => {
    renderStyleMap({marginTop: '2px', 'padding-bottom': '4px', opacity: '0.5'});
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.marginTop, '2px');
    assert.equal(el.style.paddingBottom, '4px');
    assert.equal(el.style.opacity, '0.5');
    renderStyleMap({marginTop: '4px', paddingBottom: '8px', opacity: '0.55'});
    assert.equal(el.style.marginTop, '4px');
    assert.equal(el.style.paddingBottom, '8px');
    assert.equal(el.style.opacity, '0.55');
  });

  test('removes properties', () => {
    renderStyleMap({marginTop: '2px', 'padding-bottom': '4px'});
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.marginTop, '2px');
    assert.equal(el.style.paddingBottom, '4px');
    renderStyleMap({});
    assert.equal(el.style.marginTop, '');
    assert.equal(el.style.paddingBottom, '');
  });

  test('works with static properties', () => {
    renderStyleMapStatic({marginTop: '2px', 'padding-bottom': '4px'});
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.height, '1px');
    assert.equal(el.style.color, 'red');
    assert.equal(el.style.marginTop, '2px');
    assert.equal(el.style.paddingBottom, '4px');
    renderStyleMapStatic({});
    assert.equal(el.style.height, '1px');
    assert.equal(el.style.color, 'red');
    assert.equal(el.style.marginTop, '');
    assert.equal(el.style.paddingBottom, '');
  });

  testIfSupportsCSSVariables('adds and removes CSS variables', () => {
    renderStyleMap({'--size': '2px'});
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.getPropertyValue('--size'), '2px');
    renderStyleMap({'--size': '4px'});
    assert.equal(el.style.getPropertyValue('--size'), '4px');
    renderStyleMap({});
    assert.equal(el.style.getPropertyValue('--size'), '');
  });

  test('throws when used on non-style attribute', () => {
    assert.throws(() => {
      render(html`<div id="${styleMap({})}"></div>`, container);
    });
  });

  test('throws when used in attribute with more than 1 part', () => {
    assert.throws(() => {
      render(
          html`<div style="${'height: 2px;'} ${styleMap({})}"></div>`,
          container);
    });
  });

  test('throws when used in NodePart', () => {
    assert.throws(() => {
      render(html`<div>${styleMap({})}</div>`, container);
    });
  });
});
