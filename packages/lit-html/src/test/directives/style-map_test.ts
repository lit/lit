/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AttributePart, html, render} from 'lit-html';
import {directive} from 'lit-html/directive.js';
import {StyleInfo, styleMap} from 'lit-html/directives/style-map.js';
import {assert} from '@esm-bundle/chai';

const ua = window.navigator.userAgent;
const isChrome41 = ua.indexOf('Chrome/41') > 0;
const isIE = ua.indexOf('Trident/') > 0;
const supportsCSSVariables = !isIE && !isChrome41;
const testIfSupportsCSSVariables = (test: any) =>
  supportsCSSVariables ? test : test.skip;

suite('styleMap', () => {
  let container: HTMLDivElement;

  function renderStyleMap(cssInfo: StyleInfo) {
    render(html`<div style="${styleMap(cssInfo)}"></div>`, container);
  }

  function renderStyleMapStatic(cssInfo: StyleInfo) {
    render(
      html`<div style="height: 1px; ${styleMap(cssInfo)} color: red"></div>`,
      container
    );
  }

  setup(() => {
    container = document.createElement('div');
  });

  test('render() only properties', () => {
    // Get the StyleMapDirective class indirectly, since it's not exported
    const result = styleMap({});
    // This property needs to remain unminified.
    const StyleMapDirective = result['_$litDirective$'];

    // Extend StyleMapDirective so we can test its render() method
    class TestStyleMapDirective extends StyleMapDirective {
      override update(
        _part: AttributePart,
        [styleInfo]: Parameters<this['render']>
      ) {
        return this.render(styleInfo);
      }
    }
    const testStyleMap = directive(TestStyleMapDirective);
    render(
      html`<div
        style=${testStyleMap({
          color: 'red',
          backgroundColor: 'blue',
          webkitAppearance: 'none',
          ['padding-left']: '4px',
          '--fooBar': 'red',
        })}
      ></div>`,
      container
    );
    const div = container.firstElementChild as HTMLDivElement;
    const style = div.style;
    assert.equal(style.color, 'red');
    assert.equal(style.backgroundColor, 'blue');
    assert.include(['none', undefined], style.webkitAppearance);
    assert.equal(style.paddingLeft, '4px');
    if (supportsCSSVariables) {
      assert.equal(style.getPropertyValue('--fooBar'), 'red');
      assert.equal(style.getPropertyValue('--foobar'), '');
    }
  });

  test('first render skips undefined properties', () => {
    renderStyleMap({marginTop: undefined, marginBottom: null});
    const el = container.firstElementChild as HTMLElement;
    // Note calling `setAttribute('style', '') does results in
    // `getAttribute('style') === null` on IE11; test cssText instead
    assert.equal(el.style.cssText, '');
    assert.equal(el.style.marginTop, '');
    assert.equal(el.style.marginBottom, '');
  });

  test('adds and updates properties', () => {
    renderStyleMap({
      marginTop: '2px',
      'padding-bottom': '4px',
      opacity: '0.5',
      'z-index': 10,
    });
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.marginTop, '2px');
    assert.equal(el.style.paddingBottom, '4px');
    assert.equal(el.style.opacity, '0.5');
    assert.equal(el.style.zIndex, '10');
    renderStyleMap({
      marginTop: '4px',
      paddingBottom: '8px',
      opacity: '0.55',
      'z-index': 1,
    });
    assert.equal(el.style.marginTop, '4px');
    assert.equal(el.style.paddingBottom, '8px');
    assert.equal(el.style.opacity, '0.55');
    assert.equal(el.style.zIndex, '1');
  });

  test('removes properties', () => {
    renderStyleMap({
      marginTop: '2px',
      'padding-bottom': '4px',
      borderRadius: '5px',
      borderColor: 'blue',
    });
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.marginTop, '2px');
    assert.equal(el.style.paddingBottom, '4px');
    assert.equal(el.style.borderRadius, '5px');
    assert.equal(el.style.borderColor, 'blue');
    renderStyleMap({borderRadius: undefined, borderColor: null});
    assert.equal(el.style.marginTop, '');
    assert.equal(el.style.paddingBottom, '');
    assert.equal(el.style.borderRadius, '');
    assert.equal(el.style.borderColor, '');
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

  testIfSupportsCSSVariables(test)('adds and removes CSS variables', () => {
    renderStyleMap({'--size': '2px'});
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.getPropertyValue('--size'), '2px');
    renderStyleMap({'--size': '4px'});
    assert.equal(el.style.getPropertyValue('--size'), '4px');
    renderStyleMap({});
    assert.equal(el.style.getPropertyValue('--size'), '');
  });

  // IE does not seeem to properly handle priority argument to
  // CSSStyleDeclaration.setProperty()
  (isIE ? test.skip : test)('adds priority in updated properties', () => {
    renderStyleMap({color: 'blue !important'});
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.getPropertyValue('color'), 'blue');
    assert.equal(el.style.getPropertyPriority('color'), 'important');
    renderStyleMap({color: 'green !important'});
    assert.equal(el.style.getPropertyValue('color'), 'green');
    assert.equal(el.style.getPropertyPriority('color'), 'important');
    renderStyleMap({color: 'red'});
    assert.equal(el.style.getPropertyValue('color'), 'red');
    assert.equal(el.style.getPropertyPriority('color'), '');
    renderStyleMap({});
    assert.equal(el.style.getPropertyValue('color'), '');
  });

  test('works when used with the same object', () => {
    const styleInfo: StyleInfo = {marginTop: '2px', 'padding-bottom': '4px'};
    renderStyleMap(styleInfo);
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.marginTop, '2px');
    assert.equal(el.style.paddingBottom, '4px');
    styleInfo.marginTop = '6px';
    styleInfo['padding-bottom'] = '8px';
    renderStyleMap(styleInfo);
    assert.equal(el.style.marginTop, '6px');
    assert.equal(el.style.paddingBottom, '8px');
  });

  test('works when same object adds and removes properties', () => {
    const styleInfo: StyleInfo = {marginTop: '2px', 'padding-bottom': '4px'};
    renderStyleMap(styleInfo);
    const el = container.firstElementChild as HTMLElement;
    assert.equal(el.style.marginTop, '2px');
    assert.equal(el.style.paddingBottom, '4px');
    assert.equal(el.style.color, '');
    delete styleInfo['marginTop'];
    styleInfo.color = 'green';
    renderStyleMap(styleInfo);
    assert.equal(el.style.marginTop, '');
    assert.equal(el.style.color, 'green');
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
        container
      );
    });
  });

  test('throws when used in ChildPart', () => {
    assert.throws(() => {
      render(html`<div>${styleMap({})}</div>`, container);
    });
  });
});
