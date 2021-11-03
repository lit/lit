/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, render} from '../../lit-html.js';
import {spread, SpreadValues} from '../../directives/spread.js';
import {assert} from '@esm-bundle/chai';

suite('spread', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  suite('in isolation', () => {
    test('adds and updates attributes and properties', () => {
      const go = (attributes: {}) =>
        render(html`<div ${spread(attributes)}></div>}`, container);

      go({foo: 'bar', '.prop': 42});
      const el = container.firstElementChild as HTMLElement;
      assert.equal(el.getAttribute('foo'), 'bar');
      assert.equal((el as any).prop, 42);

      go({foo: 'baz', '.prop': 99});
      assert.equal(el.getAttribute('foo'), 'baz');
      assert.equal((el as any).prop, 99);

      go({bar: 'baz'});
      assert.equal(el.hasAttribute('foo'), false);
      assert.equal((el as any).prop, undefined);
      assert.equal(el.getAttribute('bar'), 'baz');
    });

    test('adds and updates event listeners', () => {
      const go = (attributes: {}) =>
        render(html`<div ${spread(attributes)}></div>}`, container);
      let eventCount = 0;
      let eventValue = '';

      go({
        '@click': () => {
          eventValue = 'clicked';
          eventCount++;
        },
      });
      const el = container.firstElementChild as HTMLElement;
      el.click();
      assert.equal(eventValue, 'clicked');
      assert.equal(eventCount, 1);

      go({
        '@click': () => {
          eventValue = 'clicked-2';
          eventCount++;
        },
      });
      el.click();
      // ensure new listener is called
      assert.equal(eventValue, 'clicked-2');
      // ensure previous listener wasn't
      assert.equal(eventCount, 2);
    });
  });

  suite('with other bindings', () => {
    test('adds and updates attributes and properties', () => {
      const go = (x: string, attrs: SpreadValues) =>
        render(html`<div x=${x} ${spread(attrs)}></div>}`, container);

      go('a', {x: 'b', y: 'c'});
      const el = container.firstElementChild as HTMLElement;
      // Since the spread is later, it'll write to 'x' last
      assert.equal(el.getAttribute('x'), 'b');

      go('z', {x: 'b', y: 'c'});
      // Which ever value *changes* last will write. In this case the `x`
      // attribute binding changes while the `x` spread value does not, so
      // the attribute value will be written.

      // We might want to have the last binding by order always win, but this
      // would require a much bigger change
      assert.equal(el.getAttribute('x'), 'z');
    });

    test('two spreads', () => {
      const go = (a: SpreadValues, b: SpreadValues) =>
        render(html`<div ${spread(a)} ${spread(b)}></div>}`, container);

      go({x: 'a', y: 'b'}, {y: 'c', z: 'd'});
      const el = container.firstElementChild as HTMLElement;
      // Since the spread is later, it'll write to 'x' last
      assert.equal(el.getAttribute('x'), 'a');
      assert.equal(el.getAttribute('y'), 'c');
      assert.equal(el.getAttribute('z'), 'd');

      go({x: 'a', y: 'b'}, {z: 'd'});
      assert.equal(el.getAttribute('y'), 'b');
    });
  });

  suite('removal', () => {
    test('can remove a spread', () => {
      const go = (attrs?: {}) =>
        render(html`<div ${attrs && spread(attrs)}></div>}`, container);

      go({foo: 'bar', '.prop': 42});
      const el = container.firstElementChild as HTMLElement;
      assert.equal(el.getAttribute('foo'), 'bar');
      assert.equal((el as any).prop, 42);

      go();
      assert.equal(el.hasAttribute('foo'), false);
      assert.equal((el as any).prop, undefined);

      // re-add the same values
      go({foo: 'bar', '.prop': 42});
      assert.equal(el.getAttribute('foo'), 'bar');
      assert.equal((el as any).prop, 42);
    });

    test('removing a spread restores a previous binding', () => {
      const go = (attrs?: {}) =>
        render(
          html`<div x=${'a'} ${attrs && spread(attrs)}></div>}`,
          container
        );

      go({x: 'b'});
      const el = container.firstElementChild as HTMLElement;
      assert.equal(el.getAttribute('x'), 'b');

      go();
      assert.equal(el.getAttribute('x'), 'a');
    });

    test('restores previous attribute', () => {
      const go = (x: string, attrs: {}) =>
        render(html`<div x=${x} ${spread(attrs)}></div>}`, container);

      // 1) spread with key that conflicts with another binding
      go('a', {x: 'b'});
      const el = container.firstElementChild as HTMLElement;
      // since the spread is later, it'll write to 'x' last
      assert.equal(el.getAttribute('x'), 'b');

      // 1) spread removes conflicting key
      go('a', {});
      // We want the non-spread binding to be restored
      assert.equal(el.getAttribute('x'), 'a');
    });

    test('restores later attribute', () => {
      // An attribute binding after a spread() will overwrite a conflicting
      // key in the spread, so this test just makes sure that there are no
      // extraneous mutations in that case.

      const go = (x: string, attrs: {}) =>
        render(html`<div ${spread(attrs)} x=${x} ></div>}`, container);

      // 1) spread with key that conflicts with another binding
      go('a', {x: 'b'});
      const el = container.firstElementChild as HTMLElement;

      // let records: Array<MutationRecord>;
      const observer = new MutationObserver(() => {});
      observer.observe(el, {attributes: true});

      // Since the spread is earlier, it'll write to 'x' first and be
      // overwritten
      assert.equal(el.getAttribute('x'), 'a', '1');

      // 1) spread removes conflicting key
      go('a', {});

      // We want the non-spread binding to be restored
      assert.equal(el.getAttribute('x'), 'a', '2');

      const records = observer.takeRecords();
      assert.equal(records.length, 0);
    });
  });

  suite('composition', () => {});
});
