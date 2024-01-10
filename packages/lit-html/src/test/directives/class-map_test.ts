/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, svg, render} from 'lit-html';
import {ClassInfo, classMap} from 'lit-html/directives/class-map.js';
import {assert} from '@esm-bundle/chai';

suite('classMap directive', () => {
  let container: HTMLDivElement;

  function renderClassMap(cssInfo: ClassInfo) {
    render(html`<div class="${classMap(cssInfo)}"></div>`, container);
  }

  function renderClassMapStatic(cssInfo: ClassInfo) {
    render(html`<div class="aa ${classMap(cssInfo)} bb"></div>`, container);
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
    assert.isTrue(el.classList.contains('aa'), 'aa 1');
    assert.isTrue(el.classList.contains('bb'), 'bb 1');
    assert.isTrue(el.classList.contains('foo'), 'foo 1');
    renderClassMapStatic({});
    assert.isTrue(el.classList.contains('aa'), 'aa');
    assert.isTrue(el.classList.contains('bb'), 'bb');
    assert.isFalse(el.classList.contains('foo'), 'foo');
  });

  test('works with imperatively added classes', () => {
    renderClassMap({foo: true});
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('foo'));

    el.classList.add('bar');
    assert.isTrue(el.classList.contains('bar'));

    renderClassMap({foo: false});
    assert.isFalse(el.classList.contains('foo'));
    assert.isTrue(el.classList.contains('bar'));
  });

  test('can not override static classes', () => {
    renderClassMapStatic({aa: false, bb: true});
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));

    // bb is explicitly set to false
    renderClassMapStatic({aa: true, bb: false});
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));

    // both are now omitted
    renderClassMapStatic({});
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
  });

  test('changes classes when used with the same object', () => {
    const classInfo = {foo: true};
    renderClassMapStatic(classInfo);
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('foo'));
    classInfo.foo = false;
    renderClassMapStatic(classInfo);
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isFalse(el.classList.contains('foo'));
  });

  test('adds classes on SVG elements', () => {
    const cssInfo = {foo: 0, bar: true, zonk: true};
    render(svg`<circle class="${classMap(cssInfo)}"></circle>`, container);
    const el = container.firstElementChild!;
    const classes = el.getAttribute('class')!.split(' ');
    // Sigh, IE.
    assert.isTrue(classes.indexOf('foo') === -1);
    assert.isTrue(classes.indexOf('bar') > -1);
    assert.isTrue(classes.indexOf('zonk') > -1);
  });

  test('works if there are no spaces next to directive', () => {
    render(html`<div class="aa${classMap({bb: true})}cc"></div>`, container);
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('cc'));
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

  test('throws when used in ChildPart', () => {
    assert.throws(() => {
      render(html`<div>${classMap({})}</div>`, container);
    });
  });
});
