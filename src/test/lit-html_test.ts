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

import {AttributePart, defaultPartCallback, html, NodePart, Part, render, TemplateInstance, TemplatePart, TemplateResult} from '../lit-html.js';

const assert = chai.assert;

suite('lit-html', () => {

  suite('html', () => {

    test('returns a TemplateResult', () => {
      assert.instanceOf(html``, TemplateResult);
    });

    test('templates are identical for multiple calls', () => {
      const t = () => html``;
      assert.strictEqual(t().template, t().template);
    });

    test('values contain interpolated values', () => {
      const foo = 'foo', bar = 1;
      assert.deepEqual(html`${foo}${bar}`.values, [foo, bar]);
    });

    test('does not create extra empty text nodes', () => {
      const countNodes =
          (result: TemplateResult,
           getNodes: (f: DocumentFragment) => NodeList) =>
              getNodes(result.template.element.content).length;

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
      assert.equal(result.template.parts.length, 0);
      render(result, container);
      console.log(container.innerHTML);
      assert.equal(container.innerHTML, '{{}}');
    });

    test('parses parts for multiple expressions', () => {
      const result = html`
        <div a="${1}">
          <p>${2}</p>
          ${3}
          <span a="${4}">${5}</span>
        </div>`;
      const parts = result.template.parts;
      assert.equal(parts.length, 5);
    });

    test('stores raw names of attributes', () => {
      const result = html`
        <div
          someProp="${1}"
          a-nother="${2}"
          multiParts='${3} ${4}'>
          <p>${5}</p>
          <div aThing="${6}"></div>
        </div>`;
      const parts = result.template.parts;
      const names = parts.map((p: TemplatePart) => p.name);
      const rawNames = parts.map((p: TemplatePart) => p.rawName);
      assert.deepEqual(
          names, ['someprop', 'a-nother', 'multiparts', undefined, 'athing']);
      assert.deepEqual(
          rawNames,
          ['someProp', 'a-nother', 'multiParts', undefined, 'aThing']);
    });

    test('parses expressions for two attributes of one element', () => {
      const result = html`<div a="${1}" b="${2}"></div>`;
      const parts = result.template.parts;
      assert.equal(parts.length, 2);
      const instance = new TemplateInstance(result.template);
      instance._clone();
      assert.equal(instance._parts.length, 2);
    });

    test('updates when called multiple times with arrays', () => {
      const container = document.createElement('div');
      const ul = (list: string[]) => {
        const items = list.map((item) => html`<li>${item}</li>`);
        return html`<ul>${items}</ul>`;
      };
      render(ul(['a', 'b', 'c']), container);
      assert.equal(
          container.innerHTML, '<ul><li>a</li><li>b</li><li>c</li></ul>');
      render(ul(['x', 'y']), container);
      assert.equal(container.innerHTML, '<ul><li>x</li><li>y</li></ul>');
    });

    test('resists XSS attempt in node values', () => {
      const result = html`<div>${'<script>alert("boo");</script>'}</div>`;
      assert(result.template.element.innerHTML, '<div></div>');
    });

    test('resists XSS attempt in attribute values', () => {
      const result = html
      `<div foo="${'"><script>alert("boo");</script><div foo="'}"></div>`;
      assert(result.template.element.innerHTML, '<div></div>');
    });

  });

  suite('TemplateResult', () => {

    suite('first render', () => {

      test('renders a string', () => {
        const container = document.createElement('div');
        render(html`<div>${'foo'}</div>`, container);
        assert.equal(container.innerHTML, '<div>foo</div>');
      });

      test('renders a number', () => {
        const container = document.createElement('div');
        render(html`<div>${123}</div>`, container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders undefined', () => {
        const container = document.createElement('div');
        render(html`<div>${undefined}</div>`, container);
        assert.equal(container.innerHTML, '<div></div>');
      });

      test('renders null', () => {
        const container = document.createElement('div');
        render(html`<div>${null}</div>`, container);
        assert.equal(container.innerHTML, '<div></div>');
      });

      test('renders a function', () => {
        // This test just checks that we don't call the function
        const container = document.createElement('div');
        render(html`<div>${(_: any) => 123}</div>`, container);
        assert.equal(container.innerHTML, '<div>(_) =&gt; 123</div>');
      });

      test('renders arrays', () => {
        const container = document.createElement('div');
        render(html`<div>${[1, 2, 3]}</div>`, container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders nested templates', () => {
        const container = document.createElement('div');
        const partial = html`<h1>${'foo'}</h1>`;
        render(html`${partial}${'bar'}`, container);
        assert.equal(container.innerHTML, '<h1>foo</h1>bar');
      });

      test('values contain interpolated values', () => {
        const container = document.createElement('div');
        const t = html`${'a'},${'b'},${'c'}`;
        render(t, container);
        assert.equal(container.innerHTML, 'a,b,c');
      });

      // test('renders multiple nested templates', () => {
      //   const container = document.createElement('div');
      //   const partial = html`<h1>${'foo'}</h1>`;
      //   html`${partial}${'bar'}${partial}${'baz'}qux`, container);
      //   assert.equal(container.innerHTML,
      //   '<h1>foo</h1>bar<h1>foo</h1>bazqux');
      // });

      test('renders arrays of nested templates', () => {
        const container = document.createElement('div');
        render(html`<div>${[1, 2, 3].map((i) => html`${i}`)}</div>`, container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders an element', () => {
        const container = document.createElement('div');
        const child = document.createElement('p');
        render(html`<div>${child}</div>`, container);
        assert.equal(container.innerHTML, '<div><p></p></div>');
      });

      test('renders an array of elements', () => {
        const container = document.createElement('div');
        const children = [
          document.createElement('p'),
          document.createElement('a'),
          document.createElement('span')
        ];
        render(html`<div>${children}</div>`, container);
        assert.equal(
            container.innerHTML, '<div><p></p><a></a><span></span></div>');
      });

      test('renders to an attribute', () => {
        const container = document.createElement('div');
        render(html`<div foo="${'bar'}"></div>`, container);
        assert.equal(container.innerHTML, '<div foo="bar"></div>');
      });

      test('renders to an attribute without quotes', () => {
        const container = document.createElement('div');
        render(html`<div foo=${'bar'}></div>`, container);
        assert.equal(container.innerHTML, '<div foo="bar"></div>');
      });

      test('renders interpolation to an attribute', () => {
        const container = document.createElement('div');
        render(html`<div foo="1${'bar'}2${'baz'}3"></div>`, container);
        assert.equal(container.innerHTML, '<div foo="1bar2baz3"></div>');
      });

      test('renders a function to an attribute', () => {
        // This test just checks that we don't call the function
        const container = document.createElement('div');
        render(html`<div foo=${(_: any) => 123}></div>`, container);
        assert.equal(container.innerHTML, '<div foo="(_) => 123"></div>');
      });

      test('renders an array to an attribute', () => {
        const container = document.createElement('div');
        render(html`<div foo=${[1, 2, 3]}></div>`, container);
        assert.equal(container.innerHTML, '<div foo="123"></div>');
      });

      test('renders to an attribute before a node', () => {
        const container = document.createElement('div');
        render(html`<div foo="${'bar'}">${'baz'}</div>`, container);
        assert.equal(container.innerHTML, '<div foo="bar">baz</div>');
      });

      test('renders to an attribute after a node', () => {
        const container = document.createElement('div');
        render(html`<div>${'baz'}</div><div foo="${'bar'}"></div>`, container);
        assert.equal(
            container.innerHTML, '<div>baz</div><div foo="bar"></div>');
      });

      test('renders a Promise', async () => {
        const container = document.createElement('div');
        let resolve: (v: any) => void;
        const promise = new Promise((res, _) => {
          resolve = res;
        });
        render(html`<div>${promise}</div>`, container);
        assert.equal(container.innerHTML, '<div></div>');
        resolve!('foo');
        await promise;
        assert.equal(container.innerHTML, '<div>foo</div>');
      });

      test('renders racing Promises correctly', async () => {
        const container = document.createElement('div');
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
        assert.equal(container.innerHTML, '<div></div>');

        promise = promise2;
        // Second render, second Promise, still no value
        render(t(), container);
        assert.equal(container.innerHTML, '<div></div>');

        // Resolve the first Promise, should not update the container
        resolve1!('foo');
        await promise1;
        assert.equal(container.innerHTML, '<div></div>');

        // Resolve the second Promise, should update the container
        resolve2!('bar');
        await promise1;
        assert.equal(container.innerHTML, '<div>bar</div>');
      });

      test('renders a combination of stuff', () => {
        const container = document.createElement('div');
        render(html`
            <div foo="${'bar'}">
              ${'baz'}
              <p>${'qux'}</p>
            </div>`, container);
        assert.equal(container.innerHTML, `<div foo="bar">
              baz
              <p>qux</p></div>`);
      });

    });

    suite('update', () => {

      test('dirty checks simple values', () => {
        const container = document.createElement('div');
        const foo = 'aaa';

        const t = () => html`<div>${foo}</div>`;

        render(t(), container);
        assert.equal(container.innerHTML, '<div>aaa</div>');
        const text = container.firstChild!.childNodes[1] as Text;
        assert.equal(text.textContent, 'aaa');

        // Set textContent manually. Since lit-html doesn't dirty checks against
        // actual DOM, but again previous part values, this modification should
        // persist through the next render with the same value.
        text.textContent = 'bbb';
        assert.equal(text.textContent, 'bbb');
        assert.equal(container.innerHTML, '<div>bbb</div>');

        // Re-render with the same content, should be a no-op
        render(t(), container);
        assert.equal(container.innerHTML, '<div>bbb</div>');
        const text2 = container.firstChild!.childNodes[1] as Text;

        // The next node should be the same too
        assert.strictEqual(text, text2);
      });

      test('renders to and updates a container', () => {
        const container = document.createElement('div');
        let foo = 'aaa';

        const t = () => html`<div>${foo}</div>`;

        render(t(), container);
        assert.equal(container.innerHTML, '<div>aaa</div>');
        const div = container.firstChild as HTMLDivElement;
        assert.equal(div.tagName, 'DIV');

        foo = 'bbb';
        render(t(), container);
        assert.equal(container.innerHTML, '<div>bbb</div>');
        const div2 = container.firstChild as HTMLDivElement;
        // check that only the part changed
        assert.equal(div, div2);
      });

      test('renders to and updates sibling parts', () => {
        const container = document.createElement('div');
        let foo = 'foo';
        const bar = 'bar';

        const t = () => html`<div>${foo}${bar}</div>`;

        render(t(), container);
        assert.equal(container.innerHTML, '<div>foobar</div>');

        foo = 'bbb';
        render(t(), container);
        assert.equal(container.innerHTML, '<div>bbbbar</div>');
      });

      test('renders and updates attributes', () => {
        const container = document.createElement('div');
        let foo = 'foo';
        const bar = 'bar';

        const t = () => html`<div a="${foo}:${bar}"></div>`;

        render(t(), container);
        assert.equal(container.innerHTML, '<div a="foo:bar"></div>');

        foo = 'bbb';
        render(t(), container);
        assert.equal(container.innerHTML, '<div a="bbb:bar"></div>');
      });

      test('updates nested templates', () => {
        const container = document.createElement('div');
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
        assert.equal(container.innerHTML, '<h1>foo</h1>baz');

        foo = 'bbb';
        render(t(true), container);
        assert.equal(container.innerHTML, '<h1>bbb</h1>baz');

        render(t(false), container);
        assert.equal(container.innerHTML, '<h2>bar</h2>baz');
      });

      test('updates arrays', () => {
        const container = document.createElement('div');
        let items = [1, 2, 3];
        const t = () => html`<div>${items}</div>`;
        render(t(), container);
        assert.equal(container.innerHTML, '<div>123</div>');

        items = [3, 2, 1];
        render(t(), container);
        assert.equal(container.innerHTML, '<div>321</div>');
      });

      test('updates an element', () => {
        const container = document.createElement('div');
        let child: any = document.createElement('p');
        const t = () => html`<div>${child}<div></div></div>`;
        render(t(), container);
        assert.equal(container.innerHTML, '<div><p></p><div></div></div>');

        child = undefined;
        render(t(), container);
        assert.equal(container.innerHTML, '<div><div></div></div>');

        child = new Text('foo');
        render(t(), container);
        assert.equal(container.innerHTML, '<div>foo<div></div></div>');
      });

      test('updates an array of elements', () => {
        const container = document.createElement('div');
        let children: any = [
          document.createElement('p'),
          document.createElement('a'),
          document.createElement('span')
        ];
        const t = () => html`<div>${children}</div>`;
        render(t(), container);
        assert.equal(
            container.innerHTML, '<div><p></p><a></a><span></span></div>');

        children = null;
        render(t(), container);
        assert.equal(container.innerHTML, '<div></div>');

        children = new Text('foo');
        render(t(), container);
        assert.equal(container.innerHTML, '<div>foo</div>');
      });

      test(
          'overwrites an existing TemplateInstance if one exists and does ' +
              'not have a matching Template',
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

    });

    suite('extensibility', () => {

      // These tests demonstrate how a flavored layer on top of lit-html could
      // modify the parsed Template to implement different behavior, like
      // setting properties instead of attributes.

      // Note that because the template parse phase captures the pre-parsed
      // attribute names from the template strings, we can retreive the original
      // case of the names!

      const partCallback =
          (instance: TemplateInstance, templatePart: TemplatePart, node: Node):
              Part => {
                if (templatePart.type === 'attribute') {
                  return new PropertyPart(
                      instance,
                      node as Element,
                      templatePart.rawName!,
                      templatePart.strings!);
                }
                return defaultPartCallback(instance, templatePart, node);
              };

      class PropertyPart extends AttributePart {
        setValue(values: any[]): void {
          const s = this.strings;
          if (s.length === 2 && s[0] === '' && s[s.length - 1] === '') {
            // An expression that occupies the whole attribute value will leave
            // leading and trailing empty strings.
            (this.element as any)[this.name] = values[0];
          } else {
            // Interpolation, so interpolate
            let text = '';
            for (let i = 0; i < s.length; i++) {
              text += s[i];
              if (i < s.length - 1) {
                text += values[i];
              }
            }
            (this.element as any)[this.name] = text;
          }
        }
      }

      test('can replace parts with custom types', () => {
        const container = document.createElement('div');
        const t = html`<div someProp="${123}"></div>`;
        render(t, container, partCallback);
        assert.equal(container.innerHTML, '<div></div>');
        assert.strictEqual((container.firstElementChild as any).someProp, 123);
      });

      test('works with nested templates', () => {
        const container = document.createElement('div');
        const t = html`${html`<div someProp="${123}"></div>`}`;
        render(t, container, partCallback);
        assert.equal(container.innerHTML, '<div></div>');
        assert.strictEqual((container.firstElementChild as any).someProp, 123);
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
      startNode = new Text();
      endNode = new Text();
      container.appendChild(startNode);
      container.appendChild(endNode);
      const instance = new TemplateInstance(html``.template);
      part = new NodePart(instance, startNode, endNode);
    });

    suite('setValue', () => {

      test('accepts a string', () => {
        part.setValue('foo');
        assert.equal(container.innerHTML, 'foo');
      });

      test('accepts a number', () => {
        part.setValue(123);
        assert.equal(container.innerHTML, '123');
      });

      test('accepts undefined', () => {
        part.setValue(undefined);
        assert.equal(container.innerHTML, '');
      });

      test('accepts null', () => {
        part.setValue(null);
        assert.equal(container.innerHTML, '');
      });

      test('accepts a function', () => {
        part.setValue((_: any) => 123);
        assert.equal(container.innerHTML, '(_) =&gt; 123');
      });

      test('accepts an element', () => {
        part.setValue(document.createElement('p'));
        assert.equal(container.innerHTML, '<p></p>');
      });

      test('accepts arrays', () => {
        part.setValue([1, 2, 3]);
        assert.equal(container.innerHTML, '123');
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('accepts an empty array', () => {
        part.setValue([]);
        assert.equal(container.innerHTML, '');
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('accepts nested arrays', () => {
        part.setValue([1, [2], 3]);
        assert.equal(container.innerHTML, '123');
        assert.deepEqual(
            ['', '1', '', '2', '', '3', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('accepts nested templates', () => {
        part.setValue(html`<h1>${'foo'}</h1>`);
        assert.equal(container.innerHTML, '<h1>foo</h1>');
      });

      test('accepts arrays of nested templates', () => {
        part.setValue([1, 2, 3].map((i) => html`${i}`));
        assert.equal(container.innerHTML, '123');
      });

      test('accepts an array of elements', () => {
        const children = [
          document.createElement('p'),
          document.createElement('a'),
          document.createElement('span')
        ];
        part.setValue(children);
        assert.equal(container.innerHTML, '<p></p><a></a><span></span>');
      });

      test('updates a simple value to a complex one', () => {
        let value: string|TemplateResult = 'foo';
        const t = () => html`<div>${value}</div>`;
        render(t(), container);
        assert.equal(container.innerHTML, '<div>foo</div>');

        value = html`<span>bar</span>`;
        render(t(), container);
        assert.equal(container.innerHTML, '<div><span>bar</span></div>');
      });

      test('updates a complex value to a simple one', () => {
        let value: string|TemplateResult = html`<span>bar</span>`;
        const t = () => html`<div>${value}</div>`;
        render(t(), container);
        assert.equal(container.innerHTML, '<div><span>bar</span></div>');

        value = 'foo';
        render(t(), container);
        assert.equal(container.innerHTML, '<div>foo</div>');
      });

      test('updates when called multiple times with simple values', () => {
        part.setValue('abc');
        assert.equal(container.innerHTML, 'abc');
        part.setValue('def');
        assert.equal(container.innerHTML, 'def');
      });

      test('updates when called multiple times with arrays', () => {
        part.setValue([1, 2, 3]);
        assert.equal(container.innerHTML, '123');
        assert.deepEqual(
            ['', '1', '', '2', '', '3', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([]);
        assert.equal(container.innerHTML, '');
        assert.deepEqual(
            ['', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('updates when called multiple times with arrays 2', () => {
        part.setValue([1, 2, 3]);
        assert.equal(container.innerHTML, '123');
        assert.deepEqual(
            ['', '1', '', '2', '', '3', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([4, 5]);
        assert.equal(container.innerHTML, '45');
        assert.deepEqual(
            ['', '4', '', '5', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([]);
        assert.equal(container.innerHTML, '');
        assert.deepEqual(
            ['', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([4, 5]);
        assert.equal(container.innerHTML, '45');
        assert.deepEqual(
            ['', '4', '', '5', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('updates nested arrays', () => {
        part.setValue([1, [2], 3]);
        assert.equal(container.innerHTML, '123');
        assert.deepEqual(
            ['', '1', '', '2', '', '3', ''],
            Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([[1], 2, 3]);
        assert.equal(container.innerHTML, '123');
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
        assert.equal(container.innerHTML, '<p></p>123<a></a>');

        items = [1, 2, 3, 4];
        render(t(), container);
        assert.equal(container.innerHTML, '<p></p>1234<a></a>');
      });

      test(
          'updates are stable when called multiple times with templates',
          () => {
            let value = 'foo';
            const r = () => html`<h1>${value}</h1>`;
            part.setValue(r());
            assert.equal(container.innerHTML, '<h1>foo</h1>');
            const originalH1 = container.querySelector('h1');

            value = 'bar';
            part.setValue(r());
            assert.equal(container.innerHTML, '<h1>bar</h1>');
            const newH1 = container.querySelector('h1');
            assert.strictEqual(newH1, originalH1);
          });

      test(
          'updates are stable when called multiple times with arrays of templates',
          () => {
            let items = [1, 2, 3];
            const r = () => items.map((i) => html`<li>${i}</li>`);
            part.setValue(r());
            assert.equal(container.innerHTML, '<li>1</li><li>2</li><li>3</li>');
            const originalLIs = Array.from(container.querySelectorAll('li'));

            items = [3, 2, 1];
            part.setValue(r());
            assert.equal(container.innerHTML, '<li>3</li><li>2</li><li>1</li>');
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
        container.insertBefore(new Text('foo'), endNode);
        part.clear();
        assert.deepEqual(
            Array.from(container.childNodes), [startNode, endNode]);
      });

    });

  });

});
