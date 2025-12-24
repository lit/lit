/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, nothing, render, svg} from 'lit-html';
import {type ClassInfo, classMap} from 'lit-html/directives/class-map.js';
import {assert} from 'chai';

suite('classMap directive', () => {
  let container: HTMLDivElement;

  function renderClassMap(...cssInfo: ClassInfo[]) {
    render(html`<div class="${classMap(...cssInfo)}"></div>`, container);
  }

  function renderClassMapStatic(...cssInfo: ClassInfo[]) {
    render(html`<div class="aa ${classMap(...cssInfo)} bb"></div>`, container);
  }

  setup(() => {
    container = document.createElement('div');
  });

  test('adds classes', () => {
    renderClassMap({foo: 0, bar: true, zonk: true});
    const el = container.firstElementChild!;
    assert.equal(el.classList.length, 2);
    assert.isTrue(el.classList.contains('bar'));
    assert.isTrue(el.classList.contains('zonk'));
    renderClassMap({foo: 0, bar: true, zonk: true}, 'aa bb cc', 'dd');
    assert.equal(el.classList.length, 6);
    assert.isTrue(el.classList.contains('bar'));
    assert.isTrue(el.classList.contains('zonk'));
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('cc'));
    assert.isTrue(el.classList.contains('dd'));
  });

  test('removes classes', () => {
    renderClassMap({foo: true, bar: true, baz: true});
    const el = container.firstElementChild!;
    assert.equal(el.classList.length, 3);
    assert.isTrue(el.classList.contains('foo'));
    assert.isTrue(el.classList.contains('bar'));
    assert.isTrue(el.classList.contains('baz'));
    renderClassMap({foo: false, bar: true, baz: false});
    assert.equal(el.classList.length, 1);
    assert.isTrue(el.classList.contains('bar'));
    renderClassMap(
      {foo: false, bar: true, baz: true},
      {foo: true}, // once true, it will be added
      {foo: false},
      'baz'
    );
    assert.isTrue(el.classList.contains('foo'));
    assert.isTrue(el.classList.contains('bar'));
    assert.isTrue(el.classList.contains('baz'));
    renderClassMap();
    assert.equal(el.classList.length, 0);
  });

  test('removes omitted classes', () => {
    renderClassMap({foo: true, bar: true, baz: true});
    const el = container.firstElementChild!;
    assert.equal(el.classList.length, 3);
    assert.isTrue(el.classList.contains('foo'));
    assert.isTrue(el.classList.contains('bar'));
    assert.isTrue(el.classList.contains('baz'));
    renderClassMap({});
    assert.equal(el.classList.length, 0);
    renderClassMap({}, {foo: true}, 'bar', [[{baz: true}], 'aa']);
    assert.equal(el.classList.length, 4);
    assert.isTrue(el.classList.contains('foo'));
    assert.isTrue(el.classList.contains('bar'));
    assert.isTrue(el.classList.contains('baz'));
    assert.isTrue(el.classList.contains('aa'));
    renderClassMap({});
    assert.equal(el.classList.length, 0);
  });

  test('works with static classes', () => {
    renderClassMapStatic({foo: true});
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('aa'), 'aa 1');
    assert.isTrue(el.classList.contains('bb'), 'bb 1');
    assert.isTrue(el.classList.contains('foo'), 'foo 1');
    renderClassMapStatic({});
    assert.isTrue(el.classList.contains('aa'), 'aa 2');
    assert.isTrue(el.classList.contains('bb'), 'bb 2');
    assert.isFalse(el.classList.contains('foo'), 'foo 2');
    renderClassMapStatic({}, {foo: true}, 'bar', [[{baz: true}], 'cc']);
    assert.isTrue(el.classList.contains('aa'), 'aa 3');
    assert.isTrue(el.classList.contains('bb'), 'bb 3');
    assert.isTrue(el.classList.contains('cc'), 'cc 3');
    assert.isTrue(el.classList.contains('foo'), 'foo 3');
    assert.isTrue(el.classList.contains('bar'), 'bar 3');
    assert.isTrue(el.classList.contains('baz'), 'baz 3');
    renderClassMapStatic({});
    assert.equal(el.classList.length, 2, 'aa bb 4');
    assert.isTrue(el.classList.contains('aa'), 'aa 4');
    assert.isTrue(el.classList.contains('bb'), 'bb 4');
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

    renderClassMap({bar: false, baz: true}, 'aa bb cc');
    assert.isFalse(el.classList.contains('foo'));
    assert.isTrue(el.classList.contains('bar'));
    assert.isTrue(el.classList.contains('baz'));
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('cc'));
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

    // both are now omitted
    renderClassMapStatic({}, {aa: false});
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

  test('changes classes when used with the same nested object', () => {
    const classInfo1 = {foo: true};
    const classInfo2 = {bar: true};
    const classInfo3 = ['baz'];

    renderClassMapStatic(classInfo1, classInfo3, classInfo2);
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('foo'));
    assert.isTrue(el.classList.contains('bar'));
    assert.isTrue(el.classList.contains('baz'));
    classInfo1.foo = false;
    classInfo2.bar = false;
    classInfo3.length = 0;
    renderClassMapStatic(classInfo1);
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isFalse(el.classList.contains('foo'));
    assert.isFalse(el.classList.contains('bar'));
    assert.isFalse(el.classList.contains('baz'));
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

  test('adds spread classes on SVG elements', () => {
    const cssInfo = {foo: 0, bar: true, zonk: true};
    render(
      svg`<circle class="${classMap(cssInfo, 'aa', 'bb')}"></circle>`,
      container
    );
    const el = container.firstElementChild!;
    const classes = el.getAttribute('class')!.split(' ');
    // Sigh, IE.
    assert.isTrue(classes.indexOf('foo') === -1);
    assert.isTrue(classes.indexOf('bar') > -1);
    assert.isTrue(classes.indexOf('zonk') > -1);
    assert.isTrue(classes.indexOf('aa') > -1);
    assert.isTrue(classes.indexOf('bb') > -1);
  });

  test('works if there are no spaces next to directive', () => {
    render(html`<div class="aa${classMap({bb: true})}cc"></div>`, container);
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('cc'));
  });

  test('works with spreading if there are no spaces next to directive', () => {
    render(
      html`<div class="aa${classMap({bb: true}, ['dd', 'ee'], 'ff')}cc"></div>`,
      container
    );
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('cc'));
    assert.isTrue(el.classList.contains('dd'));
    assert.isTrue(el.classList.contains('ee'));
    assert.isTrue(el.classList.contains('ff'));
  });

  test('works with deep nesting', () => {
    render(
      html`<div class="aa${classMap([[['bb'], {cc: true}]], [[[['dd']]]])}ee"></div>`,
      container
    );
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('cc'));
    assert.isTrue(el.classList.contains('dd'));
    assert.isTrue(el.classList.contains('ee'));
    assert.isTrue(el.classList.length === 5);
  });

  test('works with blanks, null, undefined, false, and nothing', () => {
    render(
      html`<div class="aa${classMap(undefined, null, nothing, ' ', false, [undefined, ' ', null, nothing, false], 'bb')}cc"></div>`,
      container
    );
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('cc'));
    assert.isTrue(el.classList.length === 3);
  });

  test('works with spaces in class names', () => {
    const classInfo1 = ['ee', 'ff gg'];
    const classInfo2 = {'hh ii': true};
    renderClassMapStatic('cc  dd', classInfo1, classInfo2);
    const el = container.firstElementChild!;
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('cc'));
    assert.isTrue(el.classList.contains('dd'));
    assert.isTrue(el.classList.contains('ee'));
    assert.isTrue(el.classList.contains('ff'));
    assert.isTrue(el.classList.contains('gg'));
    assert.isTrue(el.classList.contains('hh'));
    assert.isTrue(el.classList.contains('ii'));
    assert.isTrue(el.classList.length === 9);
    classInfo1.pop();
    classInfo2['hh ii'] = false;
    renderClassMapStatic('cc  dd', classInfo1, classInfo2);
    assert.isTrue(el.classList.contains('aa'));
    assert.isTrue(el.classList.contains('bb'));
    assert.isTrue(el.classList.contains('cc'));
    assert.isTrue(el.classList.contains('dd'));
    assert.isTrue(el.classList.contains('ee'));
    assert.isFalse(el.classList.contains('ff'));
    assert.isFalse(el.classList.contains('gg'));
    assert.isFalse(el.classList.contains('hh'));
    assert.isFalse(el.classList.contains('ii'));
    assert.isTrue(el.classList.length === 5);
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
