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

import {AttributePart, defaultPartCallback, defaultTemplateFactory, directive, html, NodePart, render, svg, TemplateInstance, TemplatePart, TemplateResult} from '../core.js';

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
      const parts = defaultTemplateFactory(result).parts;
      const names = parts.map((p: TemplatePart) => p.name);
      const rawNames = parts.map((p: TemplatePart) => p.rawName);
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
      assert.deepEqual(rawNames, expectedAttributeNames);
    });

    test('parses element-less text expression', () => {
      const container = document.createElement('div');
      const result = html`<div>${1} ${2}</div>`;
      render(result, container);
      assert.equal(
          stripExpressionDelimeters(container.innerHTML), '<div>1 2</div>');
    });

    test('parses expressions for two child nodes of one element', () => {
      const container = document.createElement('div');
      const result = html`test`;
      render(result, container);
      assert.equal(stripExpressionDelimeters(container.innerHTML), 'test');
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

  suite('TemplateResult', () => {
    suite('first render', () => {
      let container: HTMLElement;

      setup(() => {
        container = document.createElement('div');
      });

      test('renders a string', () => {
        render(html`<div>${'foo'}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>foo</div>');
      });

      test('renders a number', () => {
        render(html`<div>${123}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>123</div>');
      });

      test('renders undefined', () => {
        render(html`<div>${undefined}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div></div>');
      });

      test('renders undefined in attributes', () => {
        render(html`<div attribute="it's ${undefined}"></div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div attribute="it\'s undefined"></div>');
      });

      test('renders null', () => {
        render(html`<div>${null}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div></div>');
      });

      test('does not call a function bound to text', () => {
        const f = () => {
          throw new Error();
        };
        render(html`${f}`, container);
      });

      test('renders arrays', () => {
        render(html`<div>${[1, 2, 3]}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>123</div>');
      });

      test('renders nested templates', () => {
        const partial = html`<h1>${'foo'}</h1>`;
        render(html`${partial}${'bar'}`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<h1>foo</h1>bar');
      });

      test('renders parts with whitespace after them', () => {
        render(html`<div>${'foo'} </div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>foo </div>');
      });

      test('preserves whitespace between parts', () => {
        render(html`<div>${'foo'} ${'bar'}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div>foo bar</div>');
      });

      test('renders forms as elements', () => {
        // forms are both Node and iterable

        const form = document.createElement('form');
        const inputOne = document.createElement('input');
        inputOne.name = 'one';
        const inputTwo = document.createElement('input');
        inputTwo.name = 'two';

        form.appendChild(inputOne);
        form.appendChild(inputTwo);

        render(html`${form}`, container);

        assert.equal(stripExpressionDelimeters(container.innerHTML), '<form><input name="one"><input name="two"></form>');
      });

      const testSkipForTemplatePolyfill =
          ((HTMLTemplateElement as any).decorate != null ||
           (window as any).ShadyDOM && (window as any).ShadyDOM.inUse) ?
          test.skip :
          test;

      testSkipForTemplatePolyfill(
          'renders nested templates within table content', () => {
            let table =
                html`<table>${html`<tr>${html`<td></td>`}</tr>`}</table>`;
            render(table, container);
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                '<table><tr><td></td></tr></table>');

            table = html`<tbody>${html`<tr></tr>`}</tbody>`;
            render(table, container);
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                '<tbody><tr></tr></tbody>');

            table = html`<table><tr></tr>${html`<tr></tr>`}</table>`;
            render(table, container);
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                '<table><tbody><tr></tr><tr></tr></tbody></table>');

            table = html`<table><tr><td></td>${html`<td></td>`}</tr></table>`;
            render(table, container);
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                '<table><tbody><tr><td></td><td></td></tr></tbody></table>');

            table = html`<table><tr><td></td>${html`<td></td>`}${
                html`<td></td>`}</tr></table>`;
            render(table, container);
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                '<table><tbody><tr><td></td><td></td><td></td></tr></tbody></table>');
          });

      const testSkipSafari10_0 =
          (window.navigator.userAgent.indexOf('AppleWebKit/602') === -1) ?
          test :
          test.skip;

      // On Safari 10.0 (but not 10.1), the attribute value "<table>" is
      // escaped to "&lt;table&gt;". That shouldn't cause this test to
      // fail, so we skip
      testSkipSafari10_0(
          'renders quoted attributes with "<table>" before an expression',
          () => {
            const template = html`<div a="<table>${'foo'}"></div>`;
            render(template, container);
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                `<div a="<table>foo"></div>`);
          });

      test('values contain interpolated values', () => {
        const t = html`${'a'},${'b'},${'c'}`;
        render(t, container);
        assert.equal(stripExpressionDelimeters(container.innerHTML), 'a,b,c');
      });

      // test('renders multiple nested templates', () => {
      //   const partial = html`<h1>${'foo'}</h1>`;
      //   html`${partial}${'bar'}${partial}${'baz'}qux`, container);
      //   assert.equal(stripExpressionDelimeters(container.innerHTML),
      //   '<h1>foo</h1>bar<h1>foo</h1>bazqux');
      // });

      test('renders arrays of nested templates', () => {
        render(html`<div>${[1, 2, 3].map((i) => html`${i}`)}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>123</div>');
      });

      test('renders an element', () => {
        const child = document.createElement('p');
        render(html`<div>${child}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div><p></p></div>');
      });

      test('renders an array of elements', () => {
        const children = [
          document.createElement('p'),
          document.createElement('a'),
          document.createElement('span')
        ];
        render(html`<div>${children}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div><p></p><a></a><span></span></div>');
      });

      test('renders to an attribute', () => {
        render(html`<div foo="${'bar'}"></div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div foo="bar"></div>');
      });

      test('renders multiple bindings in an attribute', () => {
        let mutationRecords: MutationRecord[] = [];
        const mutationObserver = new MutationObserver((records) => {
          mutationRecords = records;
        });
        mutationObserver.observe(container, {attributes: true, subtree: true});

        render(html`<div foo="a${'b'}c${'d'}e"></div>`, container);

        mutationRecords = mutationObserver.takeRecords();

        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div foo="abcde"></div>');
        assert.equal(mutationRecords.length, 1);
      });

      test('renders a case-sensitive attribute', () => {
        const size = 100;
        render(html`<svg viewBox="0 0 ${size} ${size}"></svg>`, container);
        assert.include(
            stripExpressionDelimeters(container.innerHTML),
            'viewBox="0 0 100 100"');

        // Make sure non-alpha valid attribute name characters are handled
        render(html`<svg view_Box="0 0 ${size} ${size}"></svg>`, container);
        assert.include(
            stripExpressionDelimeters(container.innerHTML),
            'view_Box="0 0 100 100"');
      });

      test(
          'renders to an attribute expression after an attribute literal',
          () => {
            render(html`<div a="b" foo="${'bar'}"></div>`, container);
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                '<div a="b" foo="bar"></div>');
          });

      test(
          'renders to an attribute expression before an attribute literal',
          () => {
            render(html`<div foo="${'bar'}" a="b"></div>`, container);
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                '<div a="b" foo="bar"></div>');
          });

      // Regression test for exception in template parsing caused by attributes
      // reordering when a attribute binding precedes an attribute literal.
      test(
          'renders attribute binding after attribute binding that moved',
          () => {
            render(
                html`<a href="${'foo'}" class="bar"><div id=${'a'}></div></a>`,
                container);
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                `<a class="bar" href="foo"><div id="a"></div></a>`);
          });

      test('renders to an attribute without quotes', () => {
        render(html`<div foo=${'bar'}></div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div foo="bar"></div>');
      });

      test('renders to multiple attribute expressions', () => {
        render(
            html`<div foo="${'Foo'}" bar="${'Bar'}" baz=${'Baz'}></div>`,
            container);
        assert.oneOf(stripExpressionDelimeters(container.innerHTML), [
          '<div foo="Foo" bar="Bar" baz="Baz"></div>',
          '<div foo="Foo" baz="Baz" bar="Bar"></div>'
        ]);
      });

      test('renders attributes bindings after text bindings', () => {
        render(
            html`
          <div>${''}</div>
          <div foo=${'bar'}></div>
        `,
            container);
        assert.equal(stripExpressionDelimeters(container.innerHTML), `
          <div></div>
          <div foo="bar"></div>
        `);
      });

      test('renders to attributes with attribute-like values', () => {
        render(html`<div foo="bar=${'foo'}"></div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div foo="bar=foo"></div>');
      });

      test('renders interpolation to an attribute', () => {
        render(html`<div foo="1${'bar'}2${'baz'}3"></div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div foo="1bar2baz3"></div>');
      });

      test('does not call a function bound to an attribute', () => {
        const f = () => {
          throw new Error();
        };
        render(html`<div foo=${f}></div>`, container);
        const div = container.querySelector('div')!;
        assert.isTrue(div.hasAttribute('foo'));
      });

      test('renders an array to an attribute', () => {
        render(html`<div foo=${[1, 2, 3]}></div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div foo="123"></div>');
      });

      test('renders to an attribute before a node', () => {
        render(html`<div foo="${'bar'}">${'baz'}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div foo="bar">baz</div>');
      });

      test('renders to an attribute after a node', () => {
        render(html`<div>${'baz'}</div><div foo="${'bar'}"></div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div>baz</div><div foo="bar"></div>');
      });

      test('renders a Promise', () => {
        let resolve: (v: any) => void;
        const promise = new Promise((res, _) => {
          resolve = res;
        });
        render(html`<div>${promise}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div></div>');
        resolve!('foo');
        return promise.then(() => {
          assert.equal(
              stripExpressionDelimeters(container.innerHTML), '<div>foo</div>');
        });
      });

      test('renders a sync thenable', () => {
        const promise = {
          then(cb: (foo: string) => void) {
            cb('foo');
          }
        };
        render(html`<div>${promise}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>foo</div>');
      });

      test('renders racing Promises correctly', () => {
        let resolve1: (v: any) => void;
        const promise1 = new Promise((res, _) => {
          resolve1 = res;
        });
        let resolve2: (v: any) => void;
        const promise2 = new Promise((res, _) => {
          resolve2 = res;
        });

        let promise = promise1;

        const t = () => html`<div>${promise}</div>`;

        // First render, first Promise, no value
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div></div>');

        promise = promise2;
        // Second render, second Promise, still no value
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div></div>');

        // Resolve the first Promise, should not update the container
        resolve1!('foo');
        return promise1.then(() => {
          assert.equal(
              stripExpressionDelimeters(container.innerHTML), '<div></div>');
          // Resolve the second Promise, should update the container
          resolve2!('bar');
          return promise2.then(() => {
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                '<div>bar</div>');
          });
        });
      });

      test('renders an attribute after a style binding', () => {
        render(
            html`
            <style>
              .foo {
                background: ${'black'};
              }
            </style>
            <a href="/buy/${'foo'}"></a>
          `,
            container);
        assert.equal(stripExpressionDelimeters(container.innerHTML), `
            <style>
              .foo {
                background: black;
              }
            </style>
            <a href="/buy/foo"></a>
          `);
      });

      test('bindings work in <template>', () => {
        const t = (a: string, b: string) => html`
          <template>
            <span>${a}</span>
          </template>
          <div>${b}</div>
        `;
        render(t('1', '2'), container);
        assert.equal(stripExpressionDelimeters(container.innerHTML), `
          <template>
            <span>1</span>
          </template>
          <div>2</div>
        `);
      });

      test('bindings work in <template> with attribute bindings', () => {
        const t = (a: string, b: string, c: string) => html`
          <template foo=${a}>
            <span>${b}</span>
          </template>
          <div>${c}</div>
        `;
        render(t('1', '2', '3'), container);
        assert.equal(stripExpressionDelimeters(container.innerHTML), `
          <template foo="1">
            <span>2</span>
          </template>
          <div>3</div>
        `);
      });

      test('renders no comments inside textContent', () => {
        render(html`<style>${''}</style>`, container);
        assert.equal(container.firstElementChild!.textContent, '');
      });

      test('renders a combination of stuff', () => {
        render(
            html`
            <div foo="${'bar'}">
              ${'baz'}
              <p>${'qux'}</p>
            </div>`,
            container);
        assert.equal(stripExpressionDelimeters(container.innerHTML), `
            <div foo="bar">
              baz
              <p>qux</p>
            </div>`);
      });

      test('renders SVG', () => {
        const container = document.createElement('svg');
        const t = svg`<line y1="1" y2="1"/>`;
        render(t, container);
        const line = container.firstElementChild!;
        assert.equal(line.tagName, 'line');
        assert.equal(line.namespaceURI, 'http://www.w3.org/2000/svg');
      });

      test('renders templates with comments', () => {
        const t = html`
          <div>
            <!-- this is a comment -->
            <h1 class="${'foo'}">title</h1>
            <p>${'foo'}</p>
          </div>`;
        render(t, container);
        assert.equal(stripExpressionDelimeters(container.innerHTML), `
          <div>
            <!-- this is a comment -->
            <h1 class="foo">title</h1>
            <p>foo</p>
          </div>`);
      });

      test('renders style tags with expressions correctly', () => {
        const color = 'red';
        const t = html`
          <style>
            h1 {
              color: ${color};
            }
          </style>`;
        render(t, container);
        assert.equal(stripExpressionDelimeters(container.innerHTML), `
          <style>
            h1 {
              color: red;
            }
          </style>`);
      });

      test('renders an attribute after empty style node binding', () => {
        // This test is sensitive to the exact binding in the style tag.
        // Make sure the binding takes up the whole element with no text
        // on either side of it

        // Work around a false positive lit-html pluging lint error:
        const h = html;
        render(
            h`
            <style>${'bar'}</style>
            <a href="/buy/${'foo'}"></a>
          `,
            container);
        assert.equal(stripExpressionDelimeters(container.innerHTML), `
            <style>bar</style>
            <a href="/buy/foo"></a>
          `);
      });

      test('renders expressions with preceding elements', () => {
        render(html`<a>${'foo'}</a>${html`<h1>${'bar'}</h1>`}`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<a>foo</a><h1>bar</h1>');

        // This is nearly the same test case as above, but was causing a
        // different stack trace
        render(html`<a>${'foo'}</a>${'bar'}`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<a>foo</a>bar');
      });

      test('renders directives on NodeParts', () => {
        const fooDirective = directive((part: NodePart) => {
          part.setValue('foo');
        });

        render(html`<div>${fooDirective}</div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>foo</div>');
      });

      test('renders directives on AttributeParts', () => {
        const fooDirective = directive((part: AttributePart) => {
          part.setValue('foo');
        });

        render(html`<div foo="${fooDirective}"></div>`, container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div foo="foo"></div>');
      });
    });

    suite('update', () => {
      let container: HTMLElement;

      setup(() => {
        container = document.createElement('div');
      });

      test('sanity check one', () => {
        // bump line numbers
        const foo = 'aaa';

        const t = () => html`<div>${foo}</div>`;

        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>aaa</div>');
        const text = container.firstChild!.childNodes[1] as Text;
        text.textContent = 'bbb';
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>bbb</div>');
      });

      test('dirty checks simple values', () => {
        const foo = 'aaa';

        const t = () => html`<div>${foo}</div>`;

        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>aaa</div>');
        const text = container.firstChild!.childNodes[1] as Text;
        assert.equal(text.textContent, 'aaa');

        // Set textContent manually. Since lit-html doesn't dirty check against
        // actual DOM, but again previous part values, this modification should
        // persist through the next render with the same value.
        text.textContent = 'bbb';
        assert.equal(text.textContent, 'bbb');
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>bbb</div>');

        // Re-render with the same content, should be a no-op
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>bbb</div>');
        const text2 = container.firstChild!.childNodes[1] as Text;

        // The next node should be the same too
        assert.strictEqual(text, text2);
      });

      test('dirty checks node values', async () => {
        const node = document.createElement('div');
        const t = () => html`${node}`;

        let mutationRecords: MutationRecord[] = [];
        const mutationObserver = new MutationObserver((records) => {
          mutationRecords = records;
        });
        mutationObserver.observe(container, {childList: true});

        assert.equal(stripExpressionDelimeters(container.innerHTML), '');
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div></div>');

        // Wait for mutation callback to be called
        await new Promise(setTimeout);

        const elementNodes: Array<Node> = [];
        for (const record of mutationRecords) {
          elementNodes.push(
              ...Array.from(record.addedNodes)
                  .filter((n) => n.nodeType === Node.ELEMENT_NODE));
        }
        assert.equal(elementNodes.length, 1);

        mutationRecords = [];
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div></div>');
        await new Promise(setTimeout);
        assert.equal(mutationRecords.length, 0);
      });

      test('renders to and updates a container', () => {
        let foo = 'aaa';

        const t = () => html`<div>${foo}</div>`;

        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>aaa</div>');
        const div = container.firstChild as HTMLDivElement;
        assert.equal(div.tagName, 'DIV');

        foo = 'bbb';
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>bbb</div>');
        const div2 = container.firstChild as HTMLDivElement;
        // check that only the part changed
        assert.equal(div, div2);
      });

      test('renders to and updates sibling parts', () => {
        let foo = 'foo';
        const bar = 'bar';

        const t = () => html`<div>${foo}${bar}</div>`;

        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div>foobar</div>');

        foo = 'bbb';
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div>bbbbar</div>');
      });

      test('renders and updates attributes', () => {
        let foo = 'foo';
        const bar = 'bar';

        const t = () => html`<div a="${foo}:${bar}"></div>`;

        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div a="foo:bar"></div>');

        foo = 'bbb';
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div a="bbb:bar"></div>');
      });

      test('updates nested templates', () => {
        let foo = 'foo';
        const bar = 'bar';
        const baz = 'baz';

        const t = (x: boolean) => {
          let partial;
          if (x) {
            partial = html`<h1>${foo}</h1>`;
          } else {
            partial = html`<h2>${bar}</h2>`;
          }

          return html`${partial}${baz}`;
        };

        render(t(true), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<h1>foo</h1>baz');

        foo = 'bbb';
        render(t(true), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<h1>bbb</h1>baz');

        render(t(false), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<h2>bar</h2>baz');
      });

      test('updates arrays', () => {
        let items = [1, 2, 3];
        const t = () => html`<div>${items}</div>`;
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>123</div>');

        items = [3, 2, 1];
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>321</div>');
      });

      test('updates arrays that shrink then grow', () => {
        let items: number[];
        const t = () => html`<div>${items}</div>`;

        items = [1, 2, 3];
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>123</div>');

        items = [4];
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>4</div>');

        items = [5, 6, 7];
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>567</div>');
      });

      test('updates an element', () => {
        let child: any = document.createElement('p');
        const t = () => html`<div>${child}<div></div></div>`;
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div><p></p><div></div></div>');

        child = undefined;
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div><div></div></div>');

        child = document.createTextNode('foo');
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div>foo<div></div></div>');
      });

      test('updates an array of elements', () => {
        let children: any = [
          document.createElement('p'),
          document.createElement('a'),
          document.createElement('span')
        ];
        const t = () => html`<div>${children}</div>`;
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div><p></p><a></a><span></span></div>');

        children = null;
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div></div>');

        children = document.createTextNode('foo');
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>foo</div>');
      });

      test(
          'overwrites an existing TemplateInstance if one exists and does ' +
              'not have a matching Template',
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
    });

  });

  suite('NodePart', () => {
    let container: HTMLElement;
    let startNode: Node;
    let endNode: Node;
    let part: NodePart;

    setup(() => {
      container = document.createElement('div');
      startNode = document.createTextNode('');
      endNode = document.createTextNode('');
      container.appendChild(startNode);
      container.appendChild(endNode);
      const instance = new TemplateInstance(
          defaultTemplateFactory(html``),
          defaultPartCallback,
          defaultTemplateFactory);
      part = new NodePart(instance, startNode, endNode);
    });

    suite('setValue', () => {
      test('accepts a string', () => {
        part.setValue('foo');
        assert.equal(stripExpressionDelimeters(container.innerHTML), 'foo');
      });

      test('accepts a number', () => {
        part.setValue(123);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '123');
      });

      test('accepts undefined', () => {
        part.setValue(undefined);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '');
      });

      test('accepts null', () => {
        part.setValue(null);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '');
      });

      test('accepts a function', () => {
        const f = () => {
          throw new Error();
        };
        part.setValue(f);
      });

      test('accepts an element', () => {
        part.setValue(document.createElement('p'));
        assert.equal(stripExpressionDelimeters(container.innerHTML), '<p></p>');
      });

      test('accepts arrays', () => {
        part.setValue([1, 2, 3]);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '123');
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('accepts an empty array', () => {
        part.setValue([]);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '');
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('accepts nested arrays', () => {
        part.setValue([1, [2], 3]);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '123');
        assert.deepEqual(
            ['', '1', '', '2', '', '3', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('accepts nested templates', () => {
        part.setValue(html`<h1>${'foo'}</h1>`);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<h1>foo</h1>');
      });

      test('accepts arrays of nested templates', () => {
        part.setValue([1, 2, 3].map((i) => html`${i}`));
        assert.equal(stripExpressionDelimeters(container.innerHTML), '123');
      });

      test('accepts an array of elements', () => {
        const children = [
          document.createElement('p'),
          document.createElement('a'),
          document.createElement('span')
        ];
        part.setValue(children);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<p></p><a></a><span></span>');
      });

      test('updates a simple value to a complex one', () => {
        let value: string|TemplateResult = 'foo';
        const t = () => html`<div>${value}</div>`;
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>foo</div>');

        value = html`<span>bar</span>`;
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div><span>bar</span></div>');
      });

      test('updates a complex value to a simple one', () => {
        let value: string|TemplateResult = html`<span>bar</span>`;
        const t = () => html`<div>${value}</div>`;
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<div><span>bar</span></div>');

        value = 'foo';
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML), '<div>foo</div>');
      });

      test('updates when called multiple times with simple values', () => {
        part.setValue('abc');
        assert.equal(stripExpressionDelimeters(container.innerHTML), 'abc');
        part.setValue('def');
        assert.equal(stripExpressionDelimeters(container.innerHTML), 'def');
      });

      test('updates when called multiple times with arrays', () => {
        part.setValue([1, 2, 3]);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '123');
        assert.deepEqual(
            ['', '1', '', '2', '', '3', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([]);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '');
        assert.deepEqual(
            ['', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('updates when called multiple times with arrays 2', () => {
        part.setValue([1, 2, 3]);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '123');
        assert.deepEqual(
            ['', '1', '', '2', '', '3', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([4, 5]);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '45');
        assert.deepEqual(
            ['', '4', '', '5', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([]);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '');
        assert.deepEqual(
            ['', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([4, 5]);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '45');
        assert.deepEqual(
            ['', '4', '', '5', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('updates nested arrays', () => {
        part.setValue([1, [2], 3]);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '123');
        assert.deepEqual(
            ['', '1', '', '2', '', '3', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([[1], 2, 3]);
        assert.equal(stripExpressionDelimeters(container.innerHTML), '123');
        assert.deepEqual(
            ['', '1', '', '2', '', '3', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('updates arrays with siblings', () => {
        let items = [1, 2, 3];
        const t = () => html`<p></p>${items}<a></a>`;

        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<p></p>123<a></a>');

        items = [1, 2, 3, 4];
        render(t(), container);
        assert.equal(
            stripExpressionDelimeters(container.innerHTML),
            '<p></p>1234<a></a>');
      });

      test(
          'updates are stable when called multiple times with templates',
          () => {
            let value = 'foo';
            const r = () => html`<h1>${value}</h1>`;
            part.setValue(r());
            assert.equal(
                stripExpressionDelimeters(container.innerHTML), '<h1>foo</h1>');
            const originalH1 = container.querySelector('h1');

            value = 'bar';
            part.setValue(r());
            assert.equal(
                stripExpressionDelimeters(container.innerHTML), '<h1>bar</h1>');
            const newH1 = container.querySelector('h1');
            assert.strictEqual(newH1, originalH1);
          });

      test(
          'updates are stable when called multiple times with arrays of templates',
          () => {
            let items = [1, 2, 3];
            const r = () => items.map((i) => html`<li>${i}</li>`);
            part.setValue(r());
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                '<li>1</li><li>2</li><li>3</li>');
            const originalLIs = Array.from(container.querySelectorAll('li'));

            items = [3, 2, 1];
            part.setValue(r());
            assert.equal(
                stripExpressionDelimeters(container.innerHTML),
                '<li>3</li><li>2</li><li>1</li>');
            const newLIs = Array.from(container.querySelectorAll('li'));
            assert.deepEqual(newLIs, originalLIs);
          });
    });

    suite('clear', () => {
      test('is a no-op on an already empty range', () => {
        part.clear();
        assert.deepEqual(
            Array.from(container.childNodes), [startNode, endNode]);
      });

      test('clears a range', () => {
        container.insertBefore(document.createTextNode('foo'), endNode);
        part.clear();
        assert.deepEqual(
            Array.from(container.childNodes), [startNode, endNode]);
      });
    });
  });
});
