/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, render} from '../../lit-html.js';
import {spread} from '../../directives/spread.js';
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

  suite.skip('if spread() were async', () => {
    test('can remove a spread', () => {
      const go = (attrs?: {}) =>
        render(html`<div ${attrs && spread(attrs)}></div>}`, container);

      go({foo: 'bar', '.prop': 42});
      const el = container.firstElementChild as HTMLElement;
      assert.equal(el.getAttribute('foo'), 'bar');
      assert.equal((el as any).prop, 42);

      go();
      console.log(el.getAttribute('foo'));
      assert.equal(el.hasAttribute('foo'), false);
      assert.equal((el as any).prop, undefined);
    });
  });

  suite('with other bindings', () => {
    test('adds and updates attributes and properties', () => {
      const go = (x: string, attrs: {}) =>
        render(html`<div x=${x} ${spread(attrs)}></div>}`, container);

      go('a', {x: 'b', y: 'c'});
      const el = container.firstElementChild as HTMLElement;
      // since the spread is later, it'll write to 'x' last
      assert.equal(el.getAttribute('x'), 'b');

      go('z', {x: 'b', y: 'c'});
      // which ever value *changes* last will write, due to dirty-checking
      assert.equal(el.getAttribute('x'), 'z');
    });
  });
});
