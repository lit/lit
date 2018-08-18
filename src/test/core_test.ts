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

import {defaultTemplateFactory, html} from '../index.js';
import {render} from '../lib/render.js';
import {TemplateProcessor} from '../lib/template-processor.js';
import {TemplateResult} from '../lib/template-result.js';

import {stripExpressionDelimeters} from './test-helpers.js';

const assert = chai.assert;

suite('Core', () => {
  suite('html', () => {
    test('returns a TemplateResult', () => {
      assert.instanceOf(html``, TemplateResult);
    });

    test('TemplateResult.strings are identical for multiple calls', () => {
      const t = () => html``;
      assert.strictEqual(t().strings, t().strings);
    });

    test('_getTemplate returns identical templates for multiple calls', () => {
      const t = () => html``;
      assert.strictEqual(
          defaultTemplateFactory(t()), defaultTemplateFactory(t()));
    });

    test('values contain interpolated values', () => {
      const foo = 'foo', bar = 1;
      assert.deepEqual(html`${foo}${bar}`.values, [foo, bar]);
    });

    test('does not create extra empty text nodes', () => {
      const countNodes =
          (result: TemplateResult,
           getNodes: (f: DocumentFragment) => NodeList) =>
              getNodes(defaultTemplateFactory(result).element.content).length;

      assert.equal(
          countNodes(html`<div>${0}</div>`, (c) => c.childNodes[0].childNodes),
          2);
      assert.equal(countNodes(html`${0}`, (c) => c.childNodes), 2);
      assert.equal(countNodes(html`a${0}`, (c) => c.childNodes), 2);
      assert.equal(countNodes(html`${0}a`, (c) => c.childNodes), 2);
      assert.equal(countNodes(html`${0}${0}`, (c) => c.childNodes), 3);
      assert.equal(countNodes(html`a${0}${0}`, (c) => c.childNodes), 3);
      assert.equal(countNodes(html`${0}b${0}`, (c) => c.childNodes), 3);
      assert.equal(countNodes(html`${0}${0}c`, (c) => c.childNodes), 3);
      assert.equal(countNodes(html`a${0}b${0}c`, (c) => c.childNodes), 3);
    });

    test('escapes marker sequences in text nodes', () => {
      const container = document.createElement('div');
      const result = html`{{}}`;
      assert.equal(defaultTemplateFactory(result).parts.length, 0);
      render(result, container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), '{{}}');
    });

    test('parses parts for multiple expressions', () => {
      const result = html`
        <div a="${1}">
          <p>${2}</p>
          ${3}
          <span a="${4}">${5}</span>
        </div>`;
      const parts = defaultTemplateFactory(result).parts;
      assert.equal(parts.length, 5);
    });

    test('stores raw names of attributes', () => {
      const result = html`
        <div
          someProp="${1}"
          a-nother="${2}"
          multiParts='${3} ${4}'
          👍=${5}
          (a)=${6}
          [a]=${7}
          a$=${8}>
          <p>${9}</p>
          <div aThing="${10}"></div>
        </div>`;
      const parts =
          defaultTemplateFactory(result).parts as Array<{name: string}>;
      const names = parts.map((p) => p.name);
      const expectedAttributeNames = [
        'someProp',
        'a-nother',
        'multiParts',
        '👍',
        '(a)',
        '[a]',
        'a$',
        undefined,
        'aThing'
      ];
      assert.deepEqual(names, expectedAttributeNames);
    });

    test('parses element-less text expression', () => {
      const container = document.createElement('div');
      const result = html`test`;
      render(result, container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), 'test');
    });

    test('parses expressions for two child nodes of one element', () => {
      const container = document.createElement('div');
      const result = html`<div>${1} ${2}</div>`;
      render(result, container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML), '<div>1 2</div>');
    });

    test('parses expressions for two attributes of one element', () => {
      const container = document.createElement('div');
      const result = html`<div a="${1}" b="${2}"></div>`;
      render(result, container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML),
          '<div a="1" b="2"></div>');
    });

    test('updates when called multiple times with arrays', () => {
      const container = document.createElement('div');
      const ul = (list: string[]) => {
        const items = list.map((item) => html`<li>${item}</li>`);
        return html`<ul>${items}</ul>`;
      };
      render(ul(['a', 'b', 'c']), container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML),
          '<ul><li>a</li><li>b</li><li>c</li></ul>');
      render(ul(['x', 'y']), container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML),
          '<ul><li>x</li><li>y</li></ul>');
    });

    test('resists XSS attempt in node values', () => {
      const result = html`<div>${'<script>alert("boo");</script>'}</div>`;
      assert(defaultTemplateFactory(result).element.innerHTML, '<div></div>');
    });

    test('resists XSS attempt in attribute values', () => {
      const result = html
      `<div foo="${'"><script>alert("boo");</script><div foo="'}"></div>`;
      assert(defaultTemplateFactory(result).element.innerHTML, '<div></div>');
    });
  });

  suite('composition', () => {
    let container: HTMLElement;

    setup(() => {
      container = document.createElement('div');
    });

    test('nested TemplateResults use their own processor', () => {
      class TestTemplateProcessor extends TemplateProcessor {
        handleAttributeExpressions(
            element: Element, name: string, strings: string[]) {
          if (name[0] === '&') {
            return super.handleAttributeExpressions(
                element, name.slice(1), strings);
          }
          return super.handleAttributeExpressions(element, name, strings);
        }
      }
      const processor = new TestTemplateProcessor();
      const testHtml = (strings: TemplateStringsArray, ...values: any[]) =>
          new TemplateResult(strings, values, 'html', processor);

      render(html`${testHtml`<div &foo="${'foo'}"></div>`}`, container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML),
          '<div foo="foo"></div>');
    });
  });
});
