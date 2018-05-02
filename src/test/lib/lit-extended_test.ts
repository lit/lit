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

import {html, PropertyPart, render} from '../../lib/lit-extended.js';
import {directive, html as htmlPlain} from '../../lit-html.js';

import {stripExpressionDelimeters} from '../test-helpers.js';

const assert = chai.assert;

suite('lit-extended', () => {
  suite('render', () => {

    let container: HTMLElement;

    setup(() => {
      container = document.createElement('div');
    });

    test('sets properties', () => {
      render(html`<div foo=${123} bar=${456}></div>`, container);
      const div = container.firstChild!;
      assert.equal((div as any).foo, 123);
      assert.equal((div as any).bar, 456);
    });

    test('renders to an attribute', () => {
      render(html`<div foo$="${'bar'}"></div>`, container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '<div foo="bar"></div>');
    });

    test('renders to an attribute without quotes', () => {
      render(html`<div foo$=${'bar'}></div>`, container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '<div foo="bar"></div>');
    });

    test('renders interpolation to an attribute', () => {
      render(html`<div foo$="1${'bar'}2${'baz'}3"></div>`, container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '<div foo="1bar2baz3"></div>');
    });

    test('renders a boolean attribute as an empty string when truthy', () => {
      let t = (value: any) => html`<div foo?="${value}"></div>`;

      render(t(true), container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '<div foo=""></div>');

      render(t('a'), container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '<div foo=""></div>');

      render(t(1), container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '<div foo=""></div>');
    });

    test('removes a boolean attribute when falsey', () => {
      let t = (value: any) => html`<div foo?="${value}"></div>`;

      render(t(false), container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '<div></div>');

      render(t(0), container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '<div></div>');

      render(t(null), container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '<div></div>');

      render(t(undefined), container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '<div></div>');
    });

    test('reuses an existing ExtendedTemplateInstance when available', () => {
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
          const t = (tag: any) => tag`<div>foo</div>`;

          render(t(htmlPlain), container);

          assert.equal(container.children.length, 1);
          const firstDiv = container.children[0];
          assert.equal(firstDiv.textContent, 'foo');

          render(t(html), container);

          assert.equal(container.children.length, 1);
          const secondDiv = container.children[0];
          assert.equal(secondDiv.textContent, 'foo');

          assert.notEqual(firstDiv, secondDiv);
        });

    test(
        'overwrites an existing ExtendedTemplateInstance if one exists and ' +
            'does not have a matching Template',
        () => {
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
      let thisValue;
      let event: Event;
      const listener = function(this: any, e: any) {
        event = e;
        thisValue = this;
      };
      render(html`<div on-click=${listener}></div>`, container);
      const div = container.firstChild as HTMLElement;
      div.click();
      assert.equal(thisValue, div);

      // MouseEvent is not a function in IE, so the event cannot be an instance
      // of it
      if (typeof MouseEvent === 'function') {
        assert.instanceOf(event!, MouseEvent);
      } else {
        assert.isDefined((event! as MouseEvent).initMouseEvent);
      }
    });

    test('adds event listener objects, calls with right this value', () => {
      let thisValue;
      const listener = {
        handleEvent(_e: Event) {
          thisValue = this;
        }
      };
      render(html`<div on-click=${listener}></div>`, container);
      const div = container.firstChild as HTMLElement;
      div.click();
      assert.equal(thisValue, listener);
    });

    test('only adds event listener once', () => {
      let count = 0;
      const listener = () => {
        count++;
      };
      render(html`<div on-click=${listener}></div>`, container);
      render(html`<div on-click=${listener}></div>`, container);

      const div = container.firstChild as HTMLElement;
      div.click();
      assert.equal(count, 1);
    });

    test('allows updating event listener', () => {
      let count1 = 0;
      const listener1 = () => {
        count1++;
      };
      let count2 = 0;
      const listener2 = () => {
        count2++;
      };
      render(html`<div on-click=${listener1}></div>`, container);
      render(html`<div on-click=${listener2}></div>`, container);

      const div = container.firstChild as HTMLElement;
      div.click();
      assert.equal(count1, 0);
      assert.equal(count2, 1);
    });

    test('removes event listeners', () => {
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

    test('renders directives on PropertyParts', () => {
      const fooDirective = directive((part: PropertyPart) => {
        (part.element as any)[part.name] = 1234;
      });

      render(html`<div foo="${fooDirective}"></div>`, container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '<div></div>');
      assert.equal((container.firstElementChild as any).foo, 1234);
    });

  });
});
