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

import {html, TemplateResult, AttributePart, TemplatePart, TemplateInstance} from '../lit-html.js';

declare const chai: any;
declare const mocha: any;
declare const suite: (title: string, fn: Function) => void;
declare const test: (title: string, fn: Function) => void;

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
      const names = parts.map((p: AttributePart) => p.name);
      const rawNames = parts.map((p: AttributePart) => p.rawName);
      assert.deepEqual(names, ['someprop', 'a-nother', 'multiparts', undefined, 'athing']);
      assert.deepEqual(rawNames, ['someProp', 'a-nother', 'multiParts', undefined, 'aThing']);
    });

  });

  suite('TemplateResult', () => {

    suite('first render', () => {

      test('renders a string', () => {
        const container = document.createElement('div');
        html`<div>${'foo'}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>foo</div>');
      });

      test('renders a number', () => {
        const container = document.createElement('div');
        html`<div>${123}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders undefined', () => {
        const container = document.createElement('div');
        html`<div>${undefined}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div></div>');
      });

      test('renders null', () => {
        const container = document.createElement('div');
        html`<div>${null}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div></div>');
      });

      test('renders a thunk', () => {
        const container = document.createElement('div');
        html`<div>${(_:any)=>123}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders chained thunks', () => {
        const container = document.createElement('div');
        html`<div>${(_:any)=>(_:any)=>123}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders thunks that throw as empty text', () => {
        const container = document.createElement('div');
        html`<div>${(_:any)=>{throw new Error('e')}}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div></div>');
      });

      test('renders arrays', () => {
        const container = document.createElement('div');
        html`<div>${[1,2,3]}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders nested templates', () => {
        const container = document.createElement('div');
        const partial = html`<h1>${'foo'}</h1>`;
        html`${partial}${'bar'}`.renderTo(container);
        assert.equal(container.innerHTML, '<h1>foo</h1>bar');
      });

      test('renders arrays of nested templates', () => {
        const container = document.createElement('div');
        html`<div>${[1,2,3].map((i)=>html`${i}`)}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders to an attribute', () => {
        const container = document.createElement('div');
        html`<div foo="${'bar'}"></div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div foo="bar"></div>');
      });

      test('renders to an attribute wihtout quotes', () => {
        const container = document.createElement('div');
        html`<div foo=${'bar'}></div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div foo="bar"></div>');
      });

      test('renders interpolation to an attribute', () => {
        const container = document.createElement('div');
        html`<div foo="1${'bar'}2${'baz'}3"></div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div foo="1bar2baz3"></div>');
      });

      test('renders a combination of stuff', () => {
        const container = document.createElement('div');
        html`
            <div foo="${'bar'}">
              ${'baz'}
              <p>${'qux'}</p>
            </div>`
          .renderTo(container);
        assert.equal(container.innerHTML, `
            <div foo="bar">
              baz
              <p>qux</p>
            </div>`);
      });

    });

    suite('update', () => {

      test('renders to and updates a container', () => {
        const container = document.createElement('div');
        let foo = 'aaa';

        const render = () => html`<div>${foo}</div>`;

        render().renderTo(container);
        assert.equal(container.innerHTML, '<div>aaa</div>');
        const div = container.firstChild as HTMLDivElement;
        assert.equal(div.tagName, 'DIV');
        
        foo = 'bbb';
        render().renderTo(container);
        assert.equal(container.innerHTML, '<div>bbb</div>');
        const div2 = container.firstChild as HTMLDivElement;
        // check that only the part changed
        assert.equal(div, div2);
      });

      test('renders to and updates sibling parts', () => {
        const container = document.createElement('div');
        let foo = 'foo';
        let bar = 'bar';

        const render = () => html`<div>${foo}${bar}</div>`;

        render().renderTo(container);
        assert.equal(container.innerHTML, '<div>foobar</div>');
        
        foo = 'bbb';
        render().renderTo(container);
        assert.equal(container.innerHTML, '<div>bbbbar</div>');
      });

      test('renders and updates attributes', () => {
        const container = document.createElement('div');
        let foo = 'foo';
        let bar = 'bar';

        const render = () => html`<div a="${foo}:${bar}"></div>`;

        render().renderTo(container);
        assert.equal(container.innerHTML, '<div a="foo:bar"></div>');
        
        foo = 'bbb';
        render().renderTo(container);
        assert.equal(container.innerHTML, '<div a="bbb:bar"></div>');
      });

      test('updates nested templates', () => {
        const container = document.createElement('div');
        let foo = 'foo';
        let bar = 'bar';
        let baz = 'baz';

        const render = (x: boolean) => {
          let partial;
          if (x) {
            partial = html`<h1>${foo}</h1>`;
          } else {
            partial = html`<h2>${bar}</h2>`;
          }

          return html`${partial}${baz}`;
        }

        render(true).renderTo(container);
        assert.equal(container.innerHTML, '<h1>foo</h1>baz');
        
        foo = 'bbb';
        render(true).renderTo(container);
        assert.equal(container.innerHTML, '<h1>bbb</h1>baz');

        render(false).renderTo(container);
        assert.equal(container.innerHTML, '<h2>bar</h2>baz');
      });

    });

    suite('extensibility', () => {

      test('can replace parts with custom types', () => {

        // This test demonstrates how a flavored layer on top of lit-html could
        // modify the parsed Template to implement different behavior, like setting
        // properties instead of attributes.

        // Note that because the template parse phase captures the pre-parsed
        // attribute names from the template strings, we can retreive the original
        // case of the names!

        class PropertyPart implements TemplatePart {
          type: 'property';
          index: number;
          name: string;
          strings: string[];

          constructor(index: number, name: string, strings: string[]) {
            this.index = index;
            this.name = name;
            this.strings = strings;
          }

          update(_instance: TemplateInstance, node: Node, values: Iterator<any>) {
            console.assert(node.nodeType === Node.ELEMENT_NODE);
            const s = this.strings;

            if (s[0] === '' && s[s.length - 1] === '') { 
              // An expression that occupies the whole attribute value will leave
              // leading and trailing empty strings.
              (node as any)[this.name] = values.next().value;
            } else {
              // Interpolation, so interpolate
              let text = '';
              for (let i = 0; i < s.length; i++) {
                text += s[i];
                if (i < s.length - 1) {
                  text += values.next().value;
                }
              }
              (node as any)[this.name] = text;
            }
          }
        }

        const container = document.createElement('div');
        const t = html`<div someProp="${123}"></div>`;
        const part = t.template.parts[0] as AttributePart;
        t.template.parts[0] = new PropertyPart(part.index, part.rawName, part.strings);
        t.renderTo(container);
        assert.equal(container.innerHTML, '<div></div>');
        assert.strictEqual((container.firstElementChild as any).someProp, 123);
      });

    });

  });

});


mocha.run();
