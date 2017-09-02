/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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

import {render} from '../../lib/lit-extended.js';
import {html, render as renderPlain} from '../../lit-html.js';

const assert = chai.assert;

suite('lit-extended', () => {
  suite('render', () => {

    test('sets properties', () => {
      const container = document.createElement('div');
      render(html`<div foo=${123} bar=${456}></div>`, container);
      const div = container.firstChild!;
      assert.equal((div as any).foo, 123);
      assert.equal((div as any).bar, 456);
    });

    test('reuses an existing ExtendedTemplateInstance when available', () => {
      const container = document.createElement('div');

      const t = (content: any) => html`<div>${content}</div>`;

      render(t('foo'), container);

      assert.equal(container.children.length, 1);
      const fooDiv = container.children[0];
      assert.equal(fooDiv.textContent, 'foo');

      render(t('bar'), container);

      assert.equal(container.children.length, 1);
      const barDiv = container.children[0];
      assert.equal(barDiv.textContent, 'bar');

      assert.equal(fooDiv, barDiv);
    });

    test(
        'overwrites an existing (plain) TemplateInstance if one exists, ' +
            'even if it has a matching Template',
        () => {
          const container = document.createElement('div');

          const t = () => html`<div>foo</div>`;

          renderPlain(t(), container);

          assert.equal(container.children.length, 1);
          const firstDiv = container.children[0];
          assert.equal(firstDiv.textContent, 'foo');

          render(t(), container);

          assert.equal(container.children.length, 1);
          const secondDiv = container.children[0];
          assert.equal(secondDiv.textContent, 'foo');

          assert.notEqual(firstDiv, secondDiv);
        });

    test(
        'overwrites an existing ExtendedTemplateInstance if one exists and ' +
            'does not have a matching Template',
        () => {
          const container = document.createElement('div');

          render(html`<div>foo</div>`, container);

          assert.equal(container.children.length, 1);
          const fooDiv = container.children[0];
          assert.equal(fooDiv.textContent, 'foo');

          render(html`<div>bar</div>`, container);

          assert.equal(container.children.length, 1);
          const barDiv = container.children[0];
          assert.equal(barDiv.textContent, 'bar');

          assert.notEqual(fooDiv, barDiv);
        });

    test('adds event listener functions, calls with right this value', () => {
      const container = document.createElement('div');
      let thisValue;
      let event;
      const listener = function(this: any, e: any) {
        event = e;
        thisValue = this;
      };
      render(html`<div on-click=${listener}></div>`, container);
      const div = container.firstChild as HTMLElement;
      div.click();
      assert.equal(thisValue, div);
      assert.instanceOf(event, MouseEvent);
    });

    test('adds event listener objects, calls with right this value', () => {
      const container = document.createElement('div');
      let thisValue;
      let event;
      const listener = {
        handleEvent(e: Event) {
          event = e;
          thisValue = this;
        }
      };
      render(html`<div on-click=${listener}></div>`, container);
      const div = container.firstChild as HTMLElement;
      div.click();
      assert.equal(thisValue, listener);
    });

    test('only adds event listeners once', () => {
      const container = document.createElement('div');
      let count = 0;
      const listener = () => {
        count++;
      };
      const go = () =>
          render(html`<div on-click=${listener}></div>`, container);
      go();
      go();
      go();
      const div = container.firstChild as HTMLElement;
      div.click();
      assert.equal(count, 1);
    });

    test('removes event listeners', () => {
      const container = document.createElement('div');
      let target;
      let listener: any = (e: any) => target = e.target;
      const t = () => html`<div on-click=${listener}></div>`;
      render(t(), container);
      const div = container.firstChild as HTMLElement;
      div.click();
      assert.equal(target, div);

      listener = null;
      target = undefined;
      render(t(), container);
      div.click();
      assert.equal(target, undefined);
    });


  });
});
