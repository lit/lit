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
import {
  html,
  noChange,
  nothing,
  render,
  svg,
  TemplateResult,
} from '../lib/lit-html.js';
import {chai} from '@bundled-es-modules/chai';
import {
  stripExpressionComments,
  stripExpressionMarkers,
} from './test-utils/strip-markers.js';

const {assert} = chai;

suite('lit-html', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  const assertRender = (r: TemplateResult, expected: string) => {
    render(r, container);
    assert.equal(stripExpressionComments(container.innerHTML), expected);
  };

  /**
   * These test the ability to insert the correct expression marker into the
   * HTML string before being parsed by innerHTML. Some of the tests have
   * malformed HTML to test for reasonable (non-crashing) behavior in edge
   * cases, though the exact behavior is undefined.
   */
  suite('marker insertion', () => {
    test('only text', () => {
      assertRender(html`${'A'}`, 'A');
    });

    test('attribute-like text', () => {
      assertRender(html`a=${'A'}`, 'a=A');
    });

    test('< in text', () => {
      assertRender(html`a < ${'b'}`, 'a &lt; b');
    });

    test('text child', () => {
      assertRender(html`<div>${'A'}</div>`, '<div>A</div>');
    });

    test('text child of element with unquoted attribute', () => {
      assertRender(html`<div a="b">${'d'}</div>`, '<div a="b">d</div>');
    });

    test('text child of element with unquoted attribute', () => {
      assertRender(html`<div a="b">${'d'}</div>`, '<div a="b">d</div>');
    });

    test('renders parts with whitespace after them', () => {
      // prettier-ignore
      assertRender(html`<div>${'foo'} </div>`, '<div>foo </div>');
    });

    test('renders parts that look like attributes', () => {
      assertRender(html`<div>foo bar=${'baz'}</div>`, '<div>foo bar=baz</div>');
    });

    test('renders multiple parts per element, preserving whitespace', () => {
      assertRender(html`<div>${'foo'} ${'bar'}</div>`, '<div>foo bar</div>');
    });

    test('text after element', () => {
      // prettier-ignore
      assertRender(
        html`<div></div>${'A'}`,
        '<div></div>A'
      );
    });

    test('renders next templates with preceding elements', () => {
      assertRender(
        html`<a>${'foo'}</a>${html`<h1>${'bar'}</h1>`}`,
        '<a>foo</a><h1>bar</h1>'
      );
    });

    test('renders expressions with preceding elements', () => {
      // This is nearly the same test case as above, but was causing a
      // different stack trace
      assertRender(html`<a>${'foo'}</a>${'bar'}`, '<a>foo</a>bar');
    });

    test('text in raw text element after <', () => {
      // It doesn't matter much what marker we use in <script>, <style> and
      // <textarea> since comments aren't parsed and we have to search the text
      // anyway.
      // prettier-ignore
      assertRender(
        html`<script>i < j ${'A'}</script>`,
        '<script>i < j A</script>'
      );
    });

    test('text in raw text element after >', () => {
      // prettier-ignore
      assertRender(
        html`<script>i > j ${'A'}</script>`,
        '<script>i > j A</script>'
      );
    });

    test('text in raw text element inside tag-like string', () => {
      // prettier-ignore
      assertRender(
        html`<script>"<div a=${'A'}></div>";</script>`,
        '<script>"<div a=A></div>";</script>'
      );
    });

    test('renders inside <script>: only node', () => {
      // prettier-ignore
      assertRender(html`<script>${'foo'}</script>`, '<script>foo</script>');
    });

    test('renders inside <script>: first node', () => {
      // prettier-ignore
      assertRender(html`<script>${'foo'}A</script>`,'<script>fooA</script>');
    });

    test('renders inside <script>: last node', () => {
      // prettier-ignore
      assertRender(html`<script>A${'foo'}</script>`,'<script>Afoo</script>');
    });

    test('renders inside <script>: multiple bindings', () => {
      // prettier-ignore
      assertRender(
        html`<script>A${'foo'}B${'bar'}C</script>`,
        '<script>AfooBbarC</script>');
    });

    test('renders inside <script>: attribute-like', () => {
      // prettier-ignore
      assertRender(
        html`<script>a=${'foo'}</script>`,
        '<script>a=foo</script>');
    });

    test('text after script element', () => {
      // prettier-ignore
      assertRender(
        html`<script></script>${'A'}`,
        '<script></script>A'
      );
    });

    test('text after style element', () => {
      // prettier-ignore
      assertRender(html`<style></style>${'A'}`, '<style></style>A');
    });

    test('text inside raw text element, after different raw tag', () => {
      // prettier-ignore
      assertRender(
        html`<script><style></style>"<div a=${'A'}></div>"</script>`,
        '<script><style></style>"<div a=A></div>"</script>'
      );
    });

    test('text inside raw text element, after different raw end tag', () => {
      // prettier-ignore
      assertRender(
        html`<script></style>"<div a=${'A'}></div>"</script>`,
        '<script></style>"<div a=A></div>"</script>'
      );
    });

    test('"dynamic" tag name', () => {
      render(html`<${'A'}></${'A'}>`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<></>');
    });

    test('binding after end tag name', () => {
      // we don't really care what the syntax position is here
      assertRender(html`<div></div ${'A'}>`, '<div></div>');

      // TODO (justinfagnani): This will fail. TBD how we want to handle it.
      // assertRender(html`<div></div ${'A'}>${'B'}`, '<div></div>B');
    });

    test('comment', () => {
      render(html`<!--${'A'}-->`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<!---->');
    });

    test('comment with attribute-like content', () => {
      render(html`<!-- a=${'A'}-->`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<!-- a=-->');
    });

    test('comment with element-like content', () => {
      render(html`<!-- <div>${'A'}</div> -->`, container);
      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<!-- <div></div> -->'
      );
    });

    test('text after comment', () => {
      assertRender(html`<!-- -->${'A'}`, '<!-- -->A');
    });
  });

  suite('text', () => {
    test('renders plain text expression', () => {
      render(html`test`, container);
      assert.equal(stripExpressionComments(container.innerHTML), 'test');
    });

    test('renders a string', () => {
      render(html`<div>${'foo'}</div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>foo</div>'
      );
    });

    test('renders a number', () => {
      render(html`<div>${123}</div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>123</div>'
      );
    });

    test('renders undefined as empty string', () => {
      render(html`<div>${undefined}</div>`, container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });

    test('renders null as empty string', () => {
      render(html`<div>${null}</div>`, container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });

    test('renders noChange', () => {
      const template = (i: any) => html`<div>${i}</div>`;
      render(template('foo'), container);
      render(template(noChange), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>foo</div>'
      );
    });

    test('renders nothing', () => {
      const template = (i: any) => html`<div>${i}</div>`;
      render(template('foo'), container);
      render(template(nothing), container);
      const children = Array.from(container.querySelector('div')!.childNodes);
      assert.isEmpty(
        children.filter((node) => node.nodeType !== Node.COMMENT_NODE)
      );
    });

    test.skip('renders a Symbol', () => {
      render(html`<div>${Symbol('A')}</div>`, container);
      assert.include(
        container.querySelector('div')!.textContent!.toLowerCase(),
        'symbol'
      );
    });

    test('does not call a function bound to text', () => {
      const f = () => {
        throw new Error();
      };
      render(html`${f}`, container);
    });

    test('renders nested templates', () => {
      const partial = html`<h1>${'foo'}</h1>`;
      render(html`${partial}${'bar'}`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<h1>foo</h1>bar'
      );
    });

    test('renders a template nested multiple times', () => {
      const partial = html`<h1>${'foo'}</h1>`;
      render(html`${partial}${'bar'}${partial}${'baz'}qux`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<h1>foo</h1>bar<h1>foo</h1>bazqux'
      );
    });

    test('renders an element', () => {
      const child = document.createElement('p');
      render(html`<div>${child}</div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div><p></p></div>'
      );
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

      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<form><input name="one"><input name="two"></form>'
      );
    });
  });

  suite('svg', () => {
    test('renders SVG', () => {
      const container = document.createElement('svg');
      const t = svg`<line y1="1" y2="1"/>`;
      render(t, container);
      const line = container.firstElementChild!;
      assert.equal(line.tagName, 'line');
      assert.equal(line.namespaceURI, 'http://www.w3.org/2000/svg');
    });
  });
});
