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

import {html, TemplateResult, AttributePart} from '../lit-html.js';

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

      test('renders thunks 1', () => {
        const container = document.createElement('div');
        html`<div>${(_:any)=>123}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders thunks 2', () => {
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

      test('renders attributes', () => {
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

  });

});


mocha.run();
