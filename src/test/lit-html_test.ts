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

/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />

import {directive, html as htmlPlain, AttributePart} from '../core.js';
import {html, render} from '../lit-html.js';
import {stripExpressionDelimeters} from './test-helpers.js';

const assert = chai.assert;

suite('lit-html', () => {
  suite('render', () => {
    let container: HTMLElement;

    setup(() => {
      container = document.createElement('div');
    });

    test('sets properties', () => {
      render(html`<div .foo=${123} .bar=${456}></div>`, container);
      const div = container.firstChild!;
      assert.equal((div as any).foo, 123);
      assert.equal((div as any).bar, 456);
    });

    test('renders to an attribute', () => {
      render(html`<div foo="${'bar'}"></div>`, container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML),
          '<div foo="bar"></div>');
    });

    test('renders to an attribute without quotes', () => {
      render(html`<div foo=${'bar'}></div>`, container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML),
          '<div foo="bar"></div>');
    });

    test('renders interpolation to an attribute', () => {
      render(html`<div foo="1${'bar'}2${'baz'}3"></div>`, container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML),
          '<div foo="1bar2baz3"></div>');
    });

    test('renders a case-sensitive attribute', () => {
      const size = 100;
      render(html`<svg viewBox="0 0 ${size} ${size}"></svg>`, container);
      assert.include(
          stripExpressionDelimeters(container.innerHTML),
          'viewBox="0 0 100 100"');
      assert.notInclude(
          stripExpressionDelimeters(container.innerHTML), 'viewBox$');
    });

    test('renders a boolean attribute as an empty string when truthy', () => {
      const t = (value: any) => html`<div ?foo="${value}"></div>`;

      render(t(true), container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML), '<div foo=""></div>');

      render(t('a'), container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML), '<div foo=""></div>');

      render(t(1), container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML), '<div foo=""></div>');
    });

    test('removes a boolean attribute when falsey', () => {
      const t = (value: any) => html`<div ?foo="${value}"></div>`;

      render(t(false), container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML), '<div></div>');

      render(t(0), container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML), '<div></div>');

      render(t(null), container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML), '<div></div>');

      render(t(undefined), container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML), '<div></div>');
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
      render(html`<div @click=${listener}></div>`, container);
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
      render(html`<div @click=${listener}></div>`, container);
      const div = container.firstChild as HTMLElement;
      div.click();
      assert.equal(thisValue, listener);
    });

    test('only adds event listener once', () => {
      let count = 0;
      const listener = () => {
        count++;
      };
      render(html`<div @click=${listener}></div>`, container);
      render(html`<div @click=${listener}></div>`, container);

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
      render(html`<div @click=${listener1}></div>`, container);
      render(html`<div @click=${listener2}></div>`, container);

      const div = container.firstChild as HTMLElement;
      div.click();
      assert.equal(count1, 0);
      assert.equal(count2, 1);
    });

    test(
        'allows updating event listener without extra calls to remove/addEventListener',
        () => {
          let listener: Function|null;
          const t = () => html`<div @click=${listener}></div>`;
          render(t(), container);
          const div = container.firstChild as HTMLElement;
          let addCount = 0;
          let removeCount = 0;
          div.addEventListener = () => addCount++;
          div.removeEventListener = () => removeCount++;
          listener = () => {};
          render(t(), container);
          assert.equal(addCount, 1);
          assert.equal(removeCount, 0);
          listener = () => {};
          assert.equal(addCount, 1);
          assert.equal(removeCount, 0);
          listener = null;
          render(t(), container);
          assert.equal(addCount, 1);
          assert.equal(removeCount, 1);
          listener = () => {};
          render(t(), container);
          assert.equal(addCount, 2);
          assert.equal(removeCount, 1);
          listener = () => {};
          render(t(), container);
          assert.equal(addCount, 2);
          assert.equal(removeCount, 1);
        });

    test('removes event listeners', () => {
      let target;
      let listener: any = (e: any) => target = e.target;
      const t = () => html`<div @click=${listener}></div>`;
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
      const fooDirective = directive((part: AttributePart) => {
        part.setValue(1234);
      });

      render(html`<div .foo="${fooDirective}"></div>`, container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML), '<div></div>');
      assert.equal((container.firstElementChild as any).foo, 1234);
    });

    const suiteIfCustomElementsAreSupported =
        (window.customElements != null) ? suite : suite.skip;

    suiteIfCustomElementsAreSupported('when rendering custom elements', () => {
      suiteSetup(() => {
        if (customElements.get('x-test-uses-property-setters') == null) {
          class CustomElement extends HTMLElement {
            public readonly calledSetter = false;
            private _value?: string = undefined;

            public get value(): string|undefined {
              return this._value;
            }

            public set value(value: string|undefined) {
              (this as {calledSetter: boolean}).calledSetter = true;
              this._value = value;
            }
          }

          customElements.define('x-test-uses-property-setters', CustomElement);
        }
      });

      setup(() => {
        // Container must be in the document for the custom element to upgrade
        document.body.appendChild(container);
      });

      teardown(() => {
        document.body.removeChild(container);
      });

      test('uses property setters for custom elements', () => {
        render(
            html`
          <x-test-uses-property-setters .value=${
                'foo'}></x-test-uses-property-setters>
        `,
            container);
        const instance = container.firstElementChild as HTMLElement & {
          value: string;
          calledSetter: boolean;
        };

        assert.equal(instance.value, 'foo');
        assert.isTrue(instance.calledSetter);
      });

      test(
          'uses property setters in nested templates added after the initial render',
          () => {
            const template = (content: any) => html`${content}`;

            // Do an initial render
            render(template('some content'), container);

            // Now update the rendered template, render a nested template
            const fragment = html`
          <x-test-uses-property-setters .value=${
                                 'foo'}></x-test-uses-property-setters>
        `;
            render(template(fragment), container);
            const instance = container.firstElementChild as HTMLElement & {
              value: string;
              calledSetter: boolean;
            };

            assert.equal(instance.value, 'foo');
            assert.isTrue(instance.calledSetter);
          });
    });
  });
});
