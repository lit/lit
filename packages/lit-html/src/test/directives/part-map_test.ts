/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, svg, render} from 'lit-html';
import {PartInfoMap, partMap} from 'lit-html/directives/part-map.js';
import {assert} from 'chai';

suite('partMap directive', () => {
  let container: HTMLDivElement;

  function renderPartMap(partInfo: PartInfoMap) {
    render(html`<div part="${partMap(partInfo)}"></div>`, container);
  }

  function renderPartMapStatic(partInfo: PartInfoMap) {
    render(html`<div part="aa ${partMap(partInfo)} bb"></div>`, container);
  }

  setup(() => {
    container = document.createElement('div');
  });

  test('adds parts', () => {
    renderPartMap({foo: 0, bar: true, zonk: true});
    const el = container.firstElementChild!;
    assert.isFalse(el.part.contains('foo'));
    assert.isTrue(el.part.contains('bar'));
    assert.isTrue(el.part.contains('zonk'));
  });

  test('removes parts', () => {
    renderPartMap({foo: true, bar: true, baz: true});
    const el = container.firstElementChild!;
    assert.isTrue(el.part.contains('foo'));
    assert.isTrue(el.part.contains('bar'));
    assert.isTrue(el.part.contains('baz'));
    renderPartMap({foo: false, bar: true, baz: false});
    assert.isFalse(el.part.contains('foo'));
    assert.isTrue(el.part.contains('bar'));
    assert.isFalse(el.part.contains('baz'));
  });

  test('removes omitted parts', () => {
    renderPartMap({foo: true, bar: true, baz: true});
    const el = container.firstElementChild!;
    assert.isTrue(el.part.contains('foo'));
    assert.isTrue(el.part.contains('bar'));
    assert.isTrue(el.part.contains('baz'));
    renderPartMap({});
    assert.isFalse(el.part.contains('foo'));
    assert.isFalse(el.part.contains('bar'));
    assert.isFalse(el.part.contains('baz'));
    assert.equal(el.part.length, 0);
  });

  test('works with static parts', () => {
    renderPartMapStatic({foo: true});
    const el = container.firstElementChild!;
    assert.isTrue(el.part.contains('aa'), 'aa 1');
    assert.isTrue(el.part.contains('bb'), 'bb 1');
    assert.isTrue(el.part.contains('foo'), 'foo 1');
    renderPartMapStatic({});
    assert.isTrue(el.part.contains('aa'), 'aa');
    assert.isTrue(el.part.contains('bb'), 'bb');
    assert.isFalse(el.part.contains('foo'), 'foo');
  });

  test('works with imperatively added parts', () => {
    renderPartMap({foo: true});
    const el = container.firstElementChild!;
    assert.isTrue(el.part.contains('foo'));

    el.part.add('bar');
    assert.isTrue(el.part.contains('bar'));

    renderPartMap({foo: false});
    assert.isFalse(el.part.contains('foo'));
    assert.isTrue(el.part.contains('bar'));
  });

  test('can not override static parts', () => {
    renderPartMapStatic({aa: false, bb: true});
    const el = container.firstElementChild!;
    assert.isTrue(el.part.contains('aa'));
    assert.isTrue(el.part.contains('bb'));

    // bb is explicitly set to false
    renderPartMapStatic({aa: true, bb: false});
    assert.isTrue(el.part.contains('aa'));
    assert.isTrue(el.part.contains('bb'));

    // both are now omitted
    renderPartMapStatic({});
    assert.isTrue(el.part.contains('aa'));
    assert.isTrue(el.part.contains('bb'));
  });

  test('changes parts when used with the same object', () => {
    const partInfo = {foo: true};
    renderPartMapStatic(partInfo);
    const el = container.firstElementChild!;
    assert.isTrue(el.part.contains('aa'));
    assert.isTrue(el.part.contains('bb'));
    assert.isTrue(el.part.contains('foo'));
    partInfo.foo = false;
    renderPartMapStatic(partInfo);
    assert.isTrue(el.part.contains('aa'));
    assert.isTrue(el.part.contains('bb'));
    assert.isFalse(el.part.contains('foo'));
  });

  test('adds parts on SVG elements', () => {
    const partInfo = {foo: 0, bar: true, zonk: true};
    render(svg`<circle part="${partMap(partInfo)}"></circle>`, container);
    const el = container.firstElementChild!;
    const parts = el.getAttribute('part')!.split(' ');
    assert.isTrue(parts.indexOf('foo') === -1);
    assert.isTrue(parts.indexOf('bar') > -1);
    assert.isTrue(parts.indexOf('zonk') > -1);
  });

  test('works if there are no spaces next to directive', () => {
    render(html`<div part="aa${partMap({bb: true})}cc"></div>`, container);
    const el = container.firstElementChild!;
    assert.isTrue(el.part.contains('aa'));
    assert.isTrue(el.part.contains('bb'));
    assert.isTrue(el.part.contains('cc'));
  });

  test('throws when used on non-part attribute', () => {
    assert.throws(() => {
      render(html`<div id="${partMap({})}"></div>`, container);
    });
  });

  test('throws when used in attribute with more than 1 part', () => {
    assert.throws(() => {
      render(html`<div part="${'hi'} ${partMap({})}"></div>`, container);
    });
  });

  test('throws when used in ChildPart', () => {
    assert.throws(() => {
      render(html`<div>${partMap({})}</div>`, container);
    });
  });
});
