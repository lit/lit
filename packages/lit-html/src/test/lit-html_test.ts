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
  AttributePart,
  Directive,
  directive,
  html,
  noChange,
  NodePart,
  nothing,
  render,
  svg,
  TemplateResult,
  unsafeStatic,
} from '../lib/lit-html.js';
import {assert} from '@esm-bundle/chai';
import {
  stripExpressionComments,
  stripExpressionMarkers,
} from './test-utils/strip-markers.js';

const ua = window.navigator.userAgent;
const isIe = ua.indexOf('Trident/') > 0;

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

    test('after tag-like in text', () => {
      assertRender(html`a <1a> ${'b'}`, 'a &lt;1a&gt; b');
      assertRender(html`a <-a> ${'b'}`, 'a &lt;-a&gt; b');
      assertRender(html`a <:a> ${'b'}`, 'a &lt;:a&gt; b');
    });

    test('text child', () => {
      assertRender(html`<div>${'A'}</div>`, '<div>A</div>');
    });

    test('text child of various tag names', () => {
      assertRender(html`<x-foo>${'A'}</x-foo>`, '<x-foo>A</x-foo>');
      assertRender(html`<x=foo>${'A'}</x=foo>`, '<x=foo>A</x=foo>');
      assertRender(html`<x:foo>${'A'}</x:foo>`, '<x:foo>A</x:foo>');
      assertRender(html`<x1>${'A'}</x1>`, '<x1>A</x1>');
    });

    test('text after self-closing tag', () => {
      assertRender(html`<input />${'A'}`, '<input>A');
      assertRender(
        html`<!-- @ts-ignore --><x-foo />${'A'}`,
        '<!-- @ts-ignore --><x-foo>A</x-foo>'
      );
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

    test('renders templates with comments', () => {
      // prettier-ignore
      assertRender(html`
        <div>
          <!-- this is a comment -->
          <h1 class="${'foo'}">title</h1>
          <p>${'foo'}</p>
        </div>`, `
        <div>
          <!-- this is a comment -->
          <h1 class="foo">title</h1>
          <p>foo</p>
        </div>`
      );
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

    test('renders inside raw-like element', () => {
      // prettier-ignore
      assertRender(html`<scriptx>${'foo'}</scriptx>`, '<scriptx>foo</scriptx>');
    });

    test('attribute after raw text element', () => {
      // prettier-ignore
      assertRender(
        html`<script></script><div a=${'A'}></div>`,
        '<script></script><div a="A"></div>'
      );
    });

    test('unquoted attribute', () => {
      // prettier-ignore
      assertRender(html`<div a=${'A'}></div>`, '<div a="A"></div>');
      // prettier-ignore
      assertRender(html`<div abc=${'A'}></div>`, '<div abc="A"></div>');
      // prettier-ignore
      assertRender(html`<div abc = ${'A'}></div>`, '<div abc="A"></div>');
    });

    test('quoted attribute', () => {
      // prettier-ignore
      assertRender(html`<div a="${'A'}"></div>`, '<div a="A"></div>');
      // prettier-ignore
      assertRender(html`<div abc="${'A'}"></div>`, '<div abc="A"></div>');
      // prettier-ignore
      assertRender(html`<div abc = "${'A'}"></div>`, '<div abc="A"></div>');
    });

    test('second quoted attribute', () => {
      // prettier-ignore
      assertRender(
        html`<div a="b" c="${'A'}"></div>`,
        '<div a="b" c="A"></div>'
      );
    });

    test('two quoted attributes', () => {
      // prettier-ignore
      assertRender(
        html`<div a="${'A'}" b="${'A'}"></div>`,
        '<div a="A" b="A"></div>'
      );
    });

    test('two unquoted attributes', () => {
      // prettier-ignore
      assertRender(
        html`<div a=${'A'} b=${'A'}></div>`,
        '<div a="A" b="A"></div>'
      );
    });

    test('quoted attribute multi', () => {
      assertRender(html`<div a="${'A'} ${'A'}"></div>`, '<div a="A A"></div>');
    });

    test('quoted attribute with markup', () => {
      // prettier-ignore
      assertRender(
        html`<div a="<table>${'A'}"></div>`,
        '<div a="<table>A"></div>'
      );
    });

    test('text after quoted attribute', () => {
      assertRender(html`<div a="${'A'}">${'A'}</div>`, '<div a="A">A</div>');
    });

    test('text after unquoted attribute', () => {
      assertRender(html`<div a=${'A'}>${'A'}</div>`, '<div a="A">A</div>');
    });

    // test('inside start tag', () => {
    //   assertRender(html`<div ${attr`a="b"`}></div>`, '<div a="b"></div>');
    // });

    // test('inside start tag x2', () => {
    //   // We don't support multiple attribute-position bindings yet, so just
    //   // ensure this parses ok
    //   assertRender(
    //     html`<div ${attr`a="b"`} ${attr`c="d"`}></div>`,
    //     '<div a="b"></div>'
    //   );
    // });

    // test('inside start tag after unquoted attribute', () => {
    //   // prettier-ignore
    //   assertRender(html`<div a=b ${attr`c="d"`}></div>`, '<div a="b" c="d"></div>');
    // });

    // test('inside start tag after quoted attribute', () => {
    //   // prettier-ignore
    //   assertRender(html`<div a="b" ${attr`c="d"`}></div>`, '<div a="b" c="d"></div>');
    // });

    // test('inside start tag before unquoted attribute', () => {
    //   // bound attributes always appear after static attributes
    //   assertRender(
    //     html`<div ${attr`c="d"`} a="b"></div>`,
    //     '<div a="b" c="d"></div>'
    //   );
    // });

    // test('inside start tag before quoted attribute', () => {
    //   // bound attributes always appear after static attributes
    //   assertRender(
    //     html`<div ${attr`c="d"`} a="b"></div>`,
    //     '<div a="b" c="d"></div>'
    //   );
    // });

    test('"dynamic" tag name', () => {
      render(html`<${'A'}></${'A'}>`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<></>');
    });

    test('malformed "dynamic" tag name', () => {
      // `</ ` starts a comment
      render(html`<${'A'}></ ${'A'}>`, container);
      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<><!-- --></>'
      );

      // Currently fails:
      // render(html`<${'A'}></ ${'A'}>${'B'}`, container);
      // assert.equal(stripExpressionMarkers(container.innerHTML), '<><!-- -->B</>');
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

  suite('attributes', () => {
    test('renders to a quoted attribute', () => {
      render(html`<div foo="${'bar'}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="bar"></div>'
      );
    });

    test('renders to an unquoted attribute', () => {
      render(html`<div foo=${'bar'}></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="bar"></div>'
      );
    });

    test('renders interpolation to an attribute', () => {
      render(html`<div foo="A${'B'}C"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="ABC"></div>'
      );
    });

    test('renders multiple bindings in an attribute', () => {
      render(html`<div foo="a${'b'}c${'d'}e"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="abcde"></div>'
      );
    });

    test('renders two attributes on one element', () => {
      const result = html`<div a="${1}" b="${2}"></div>`;
      render(result, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div a="1" b="2"></div>'
      );
    });

    test('renders multiple bindings in two attributes', () => {
      render(
        html`<div foo="a${'b'}c${'d'}e" bar="a${'b'}c${'d'}e"></div>`,
        container
      );
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="abcde" bar="abcde"></div>'
      );
    });

    test.skip('renders a Symbol to an attribute', () => {
      render(html`<div foo=${Symbol('A')}></div>`, container);
      assert.include(
        container.querySelector('div')!.getAttribute('foo')!.toLowerCase(),
        'symbol'
      );
    });

    test.skip('renders a Symbol in an array to an attribute', () => {
      render(html`<div foo=${[Symbol('A')] as any}></div>`, container);
      assert.include(
        container.querySelector('div')!.getAttribute('foo')!.toLowerCase(),
        'symbol'
      );
    });

    test('renders a binding in a style attribute', () => {
      const t = html`<div style="color: ${'red'}"></div>`;
      render(t, container);
      if (isIe) {
        assert.equal(
          stripExpressionComments(container.innerHTML),
          '<div style="color: red;"></div>'
        );
      } else {
        assert.equal(
          stripExpressionComments(container.innerHTML),
          '<div style="color: red"></div>'
        );
      }
    });

    test('renders multiple bindings in a style attribute', () => {
      const t = html`<div style="${'color'}: ${'red'}"></div>`;
      render(t, container);
      if (isIe) {
        assert.equal(
          stripExpressionComments(container.innerHTML),
          '<div style="color: red;"></div>'
        );
      } else {
        assert.equal(
          stripExpressionComments(container.innerHTML),
          '<div style="color: red"></div>'
        );
      }
    });

    test('renders a binding in a class attribute', () => {
      render(html`<div class="${'red'}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div class="red"></div>'
      );
    });

    test('renders a binding in an input value attribute', () => {
      render(html`<input value="${'the-value'}" />`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<input value="the-value">'
      );
      assert.equal(container.querySelector('input')!.value, 'the-value');
    });

    test('renders a case-sensitive attribute', () => {
      const size = 100;
      render(html`<svg viewBox="0 0 ${size} ${size}"></svg>`, container);
      assert.include(
        stripExpressionComments(container.innerHTML),
        'viewBox="0 0 100 100"'
      );

      // Make sure non-alpha valid attribute name characters are handled
      render(html`<svg view_Box="0 0 ${size} ${size}"></svg>`, container);
      assert.include(
        stripExpressionComments(container.innerHTML),
        'view_Box="0 0 100 100"'
      );
    });

    test('renders to an attribute expression after an attribute literal', () => {
      render(html`<div a="b" foo="${'bar'}"></div>`, container);
      // IE and Edge can switch attribute order!
      assert.include(
        ['<div a="b" foo="bar"></div>', '<div foo="bar" a="b"></div>'],
        stripExpressionComments(container.innerHTML)
      );
    });

    test('renders to an attribute expression before an attribute literal', () => {
      render(html`<div foo="${'bar'}" a="b"></div>`, container);
      // IE and Edge can switch attribute order!
      assert.include(
        ['<div a="b" foo="bar"></div>', '<div foo="bar" a="b"></div>'],
        stripExpressionComments(container.innerHTML)
      );
    });

    // Regression test for exception in template parsing caused by attributes
    // reordering when a attribute binding precedes an attribute literal.
    test('renders attribute binding after attribute binding that moved', () => {
      render(
        html`<a href="${'foo'}" class="bar"><div id=${'a'}></div></a>`,
        container
      );
      assert.equal(
        stripExpressionComments(container.innerHTML),
        `<a class="bar" href="foo"><div id="a"></div></a>`
      );
    });

    test('renders a bound attribute without quotes', () => {
      render(html`<div foo=${'bar'}></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="bar"></div>'
      );
    });

    test('renders multiple bound attributes', () => {
      render(
        html`<div foo="${'Foo'}" bar="${'Bar'}" baz=${'Baz'}></div>`,
        container
      );
      assert.oneOf(stripExpressionComments(container.innerHTML), [
        '<div foo="Foo" bar="Bar" baz="Baz"></div>',
        '<div foo="Foo" baz="Baz" bar="Bar"></div>',
        '<div bar="Bar" foo="Foo" baz="Baz"></div>',
      ]);
    });

    test('renders multiple bound attributes without quotes', () => {
      render(
        html`<div foo=${'Foo'} bar=${'Bar'} baz=${'Baz'}></div>`,
        container
      );
      assert.oneOf(stripExpressionComments(container.innerHTML), [
        '<div foo="Foo" bar="Bar" baz="Baz"></div>',
        '<div foo="Foo" baz="Baz" bar="Bar"></div>',
        '<div bar="Bar" foo="Foo" baz="Baz"></div>',
      ]);
    });

    test('renders multi-expression attribute without quotes', () => {
      render(html`<div foo="${'Foo'}${'Bar'}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="FooBar"></div>'
      );
    });

    test('renders to attributes with attribute-like values', () => {
      render(html`<div foo="bar=${'foo'}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="bar=foo"></div>'
      );
    });

    test('does not call a function bound to an attribute', () => {
      const f = () => {
        throw new Error();
      };
      render(html`<div foo=${f as any}></div>`, container);
      const div = container.querySelector('div')!;
      assert.isTrue(div.hasAttribute('foo'));
    });

    test('renders an array to an attribute', () => {
      render(html`<div foo=${[1, 2, 3] as any}></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="1,2,3"></div>'
      );
    });

    test('renders to an attribute before a node', () => {
      render(html`<div foo="${'bar'}">${'baz'}</div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="bar">baz</div>'
      );
    });

    test('renders to an attribute after a node', () => {
      // prettier-ignore
      render(html`<div>${'baz'}</div><div foo="${'bar'}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>baz</div><div foo="bar"></div>'
      );
    });

    test('renders undefined in attributes', () => {
      render(html`<div attribute="it's ${undefined}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div attribute="it\'s "></div>'
      );
    });

    test('renders undefined in attributes', () => {
      render(html`<div attribute="${undefined as any}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div attribute=""></div>'
      );
    });

    test('nothing sentinel removes an attribute', () => {
      const go = (v: any) => html`<div a=${v}></div>`;
      render(go(nothing), container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');

      render(go('a'), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div a="a"></div>'
      );

      render(go(nothing), container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });

    test('interpolated nothing sentinel removes an attribute', () => {
      const go = (v: any) => html`<div a="A${v}"></div>`;
      render(go('a'), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div a="Aa"></div>'
      );

      render(go(nothing), container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });

    test('noChange works', () => {
      const go = (v: any) => render(html`<div foo=${v}></div>`, container);
      go('A');
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="A"></div>',
        'A'
      );
      const observer = new MutationObserver(() => {});
      observer.observe(container, {attributes: true, subtree: true});

      go(noChange);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="A"></div>',
        'B'
      );
      assert.isEmpty(observer.takeRecords());
    });

    test('noChange works on one of multiple expressions', () => {
      const go = (a: any, b: any) =>
        render(html`<div foo="${a}:${b}"></div>`, container);
      go('A', 'B');
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="A:B"></div>',
        'A'
      );
      go(noChange, 'C');
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="A:C"></div>',
        'B'
      );
    });
  });

  suite('boolean attributes', () => {
    test('adds attributes for true values', () => {
      render(html`<div ?foo=${true}></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo=""></div>'
      );
    });

    test('removes attributes for false values', () => {
      render(html`<div ?foo=${false}></div>`, container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });

    test('removes attributes for nothing values', () => {
      const go = (v: any) => render(html`<div ?foo=${v}></div>`, container);

      go(nothing);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');

      go(true);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo=""></div>'
      );

      go(nothing);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });

    test('noChange works', () => {
      const go = (v: any) => render(html`<div ?foo=${v}></div>`, container);
      go(true);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo=""></div>'
      );
      const observer = new MutationObserver(() => {});
      observer.observe(container, {attributes: true, subtree: true});
      go(noChange);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo=""></div>'
      );
      assert.isEmpty(observer.takeRecords());
    });
  });

  suite('properties', () => {
    test('sets properties', () => {
      render(html`<div .foo=${123} .Bar=${456}></div>`, container);
      const div = container.querySelector('div')!;
      assert.strictEqual((div as any).foo, 123);
      assert.strictEqual((div as any).Bar, 456);
    });

    test('nothing becomes undefined', () => {
      const go = (v: any) => render(html`<div .foo=${v}></div>`, container);

      go(1);
      const div = container.querySelector('div')!;
      assert.strictEqual((div as any).foo, 1);

      go(nothing);
      assert.strictEqual((div as any).foo, undefined);
    });

    test('noChange works', () => {
      const go = (v: any) => render(html`<div .foo=${v}></div>`, container);
      go(1);
      const div = container.querySelector('div')!;
      assert.strictEqual((div as any).foo, 1);

      go(noChange);
      assert.strictEqual((div as any).foo, 1);
    });
  });

  suite('events', () => {
    setup(() => {
      document.body.appendChild(container);
    });

    teardown(() => {
      document.body.removeChild(container);
    });

    test('adds event listener functions, calls with right this value', () => {
      let thisValue;
      let event: Event | undefined = undefined;
      const listener = function (this: any, e: any) {
        event = e;
        thisValue = this;
      };
      const eventContext = {} as EventTarget; // eslint-disable-line
      render(html`<div @click=${listener}></div>`, container, {eventContext});
      const div = container.querySelector('div')!;
      div.click();
      if (event === undefined) {
        throw new Error(`Event listener never fired!`);
      }
      assert.equal(thisValue, eventContext);

      // MouseEvent is not a function in IE, so the event cannot be an instance
      // of it
      if (typeof MouseEvent === 'function') {
        assert.instanceOf(event, MouseEvent);
      } else {
        assert.isDefined((event as MouseEvent).initMouseEvent);
      }
    });

    test('adds event listener objects, calls with right this value', () => {
      let thisValue;
      const listener = {
        handleEvent(_e: Event) {
          thisValue = this;
        },
      };
      const eventContext = {} as EventTarget; // eslint-disable-line
      render(html`<div @click=${listener}></div>`, container, {eventContext});
      const div = container.querySelector('div')!;
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

      const div = container.querySelector('div')!;
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
      const t = (listener: () => void) => html`<div @click=${listener}></div>`;
      render(t(listener1), container);
      render(t(listener2), container);

      const div = container.querySelector('div')!;
      div.click();
      assert.equal(count1, 0);
      assert.equal(count2, 1);
    });

    test('allows updating event listener without extra calls to remove/addEventListener', () => {
      let listener: Function | null;
      const t = () => html`<div @click=${listener}></div>`;
      render(t(), container);
      const div = container.querySelector('div')!;

      let addCount = 0;
      let removeCount = 0;
      div.addEventListener = () => addCount++;
      div.removeEventListener = () => removeCount++;

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      listener = () => {};
      render(t(), container);
      assert.equal(addCount, 1);
      assert.equal(removeCount, 0);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      listener = () => {};
      render(t(), container);
      assert.equal(addCount, 1);
      assert.equal(removeCount, 0);

      listener = null;
      render(t(), container);
      assert.equal(addCount, 1);
      assert.equal(removeCount, 1);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      listener = () => {};
      render(t(), container);
      assert.equal(addCount, 2);
      assert.equal(removeCount, 1);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      listener = () => {};
      render(t(), container);
      assert.equal(addCount, 2);
      assert.equal(removeCount, 1);
    });

    test('removes event listeners', () => {
      let target;
      let listener: any = (e: any) => (target = e.target);
      const t = () => html`<div @click=${listener}></div>`;
      render(t(), container);
      const div = container.querySelector('div')!;
      div.click();
      assert.equal(target, div);

      listener = null;
      target = undefined;
      render(t(), container);
      div.click();
      assert.equal(target, undefined);
    });

    test('allows capturing events', () => {
      let event!: Event;
      let eventPhase!: number;
      const listener = {
        handleEvent(e: Event) {
          event = e;
          // read here because it changes
          eventPhase = event.eventPhase;
        },
        capture: true,
      };
      render(
        html`
          <div id="outer" @test=${listener}>
            <div id="inner"><div></div></div>
          </div>
        `,
        container
      );
      const inner = container.querySelector('#inner')!;
      inner.dispatchEvent(new Event('test'));
      assert.isOk(event);
      assert.equal(eventPhase, Event.CAPTURING_PHASE);
    });

    test('event listeners can see events fired by dynamic children', () => {
      // This tests that node directives are called in the commit phase, not
      // the setValue phase
      class TestElement1 extends HTMLElement {
        connectedCallback() {
          this.dispatchEvent(
            new CustomEvent('test-event', {
              bubbles: true,
            })
          );
        }
      }
      customElements.define('test-element-1', TestElement1);

      let event: Event | undefined = undefined;
      const listener = (e: Event) => {
        event = e;
      };
      document.body.appendChild(container);
      render(
        html`<div @test-event=${listener}>
          ${html`<test-element-1></test-element-1>`}
        </div>`,
        container
      );
      assert.isOk(event);
    });
  });

  suite('static', () => {
    test('static text binding', () => {
      render(html`${unsafeStatic('<p>Hello</p>')}`, container);
      // If this were a dynamic binding, the tags would be escaped
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<p>Hello</p>'
      );
    });

    test('static attribute binding', () => {
      render(html`<div class="${unsafeStatic('cool')}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div class="cool"></div>'
      );
      // TODO: test that this is actually static. It's not currently possible with
      // the public API
    });

    test('static tag binding', () => {
      const tagName = unsafeStatic('div');
      render(html`<${tagName}></${tagName}>`, container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });

    test('dynamic binding after static text binding', () => {
      render(html`${unsafeStatic('<p>Hello</p>')}${'<p>World</p>'}`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<p>Hello</p>&lt;p&gt;World&lt;/p&gt;'
      );
    });
  });

  suite('updates', () => {
    let container: HTMLElement;

    setup(() => {
      container = document.createElement('div');
    });

    test('dirty checks simple values', () => {
      const foo = 'aaa';

      const t = () => html`<div>${foo}</div>`;

      render(t(), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>aaa</div>'
      );
      const text = container.querySelector('div')!;
      assert.equal(text.textContent, 'aaa');

      // Set textContent manually. Since lit-html doesn't dirty check against
      // actual DOM, but again previous part values, this modification should
      // persist through the next render with the same value.
      text.textContent = 'bbb';
      assert.equal(text.textContent, 'bbb');
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>bbb</div>'
      );

      // Re-render with the same content, should be a no-op
      render(t(), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>bbb</div>'
      );
      const text2 = container.querySelector('div')!;

      // The next node should be the same too
      assert.strictEqual(text, text2);
    });

    test('dirty checks node values', async () => {
      const node = document.createElement('div');
      const t = () => html`${node}`;

      const observer = new MutationObserver(() => {});
      observer.observe(container, {childList: true, subtree: true});

      assert.equal(stripExpressionComments(container.innerHTML), '');
      render(t(), container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');

      const elementNodes: Node[] = [];
      let mutationRecords: MutationRecord[] = observer.takeRecords();
      for (const record of mutationRecords) {
        elementNodes.push(
          ...Array.from(record.addedNodes).filter(
            (n) => n.nodeType === Node.ELEMENT_NODE
          )
        );
      }
      assert.equal(elementNodes.length, 1);

      mutationRecords = [];
      render(t(), container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
      mutationRecords = observer.takeRecords();
      assert.equal(mutationRecords.length, 0);
    });

    test('renders to and updates a container', () => {
      let foo = 'aaa';

      const t = () => html`<div>${foo}</div>`;

      render(t(), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>aaa</div>'
      );
      const div = container.querySelector('div')!;
      assert.equal(div.tagName, 'DIV');

      foo = 'bbb';
      render(t(), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>bbb</div>'
      );
      const div2 = container.querySelector('div')!;
      // check that only the part changed
      assert.equal(div, div2);
    });

    test('renders to and updates sibling parts', () => {
      let foo = 'foo';
      const bar = 'bar';

      const t = () => html`<div>${foo}${bar}</div>`;

      render(t(), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>foobar</div>'
      );

      foo = 'bbb';
      render(t(), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>bbbbar</div>'
      );
    });

    test('renders and updates attributes', () => {
      let foo = 'foo';
      const bar = 'bar';

      const t = () => html`<div a="${foo}:${bar}"></div>`;

      render(t(), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div a="foo:bar"></div>'
      );

      foo = 'bbb';
      render(t(), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div a="bbb:bar"></div>'
      );
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
        stripExpressionComments(container.innerHTML),
        '<h1>foo</h1>baz'
      );

      foo = 'bbb';
      render(t(true), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<h1>bbb</h1>baz'
      );

      render(t(false), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<h2>bar</h2>baz'
      );
    });

    test('updates an element', () => {
      let child: any = document.createElement('p');
      // prettier-ignore
      const t = () => html`<div>${child}<div></div></div>`;
      render(t(), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div><p></p><div></div></div>'
      );

      child = undefined;
      render(t(), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div><div></div></div>'
      );

      child = document.createTextNode('foo');
      render(t(), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>foo<div></div></div>'
      );
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
      }
    );
  });

  suite('directives', () => {
    // A stateful directive
    class CountDirective extends Directive {
      count = 0;
      render(v: unknown) {
        return `${v}:${++this.count}`;
      }
    }
    const count = directive(CountDirective);

    test('renders directives on NodeParts', () => {
      class TestDirective extends Directive {
        render(v: string) {
          return html`TEST:${v}`;
        }
      }
      const testDirective = directive(TestDirective);

      render(html`<div>${testDirective('A')}</div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>TEST:A</div>'
      );
    });

    test('directives are stateful', () => {
      const go = (v: string) => {
        render(html`<div>${count(v)}</div>`, container);
      };
      go('A');
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>A:1</div>'
      );
      go('A');
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>A:2</div>'
      );
      go('B');
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>B:3</div>'
      );
    });

    test('directives can update', () => {
      let receivedPart: NodePart;
      let receivedValue: unknown;

      class TestUpdateDirective extends Directive {
        render(v: unknown) {
          return v;
        }

        update(part: NodePart, [v]: Parameters<this['render']>) {
          receivedPart = part;
          receivedValue = v;
          return this.render(v);
        }
      }
      const update = directive(TestUpdateDirective);
      const go = (v: boolean) => {
        render(html`<div>${update(v)}</div>`, container);
      };
      go(true);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>true</div>'
      );
      assert.instanceOf(receivedPart!, NodePart);
      assert.equal(receivedValue, true);
    });

    test('renders directives on AttributeParts', () => {
      const go = () => html`<div foo=${count('A')}></div>`;
      render(go(), container);
      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div foo="A:1"></div>'
      );
      render(go(), container);
      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div foo="A:2"></div>'
      );
    });

    test('renders multiple directives on AttributeParts', () => {
      const go = () => html`<div foo="a:${count('A')}:b:${count('B')}"></div>`;
      render(go(), container);
      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div foo="a:A:1:b:B:1"></div>'
      );
      render(go(), container);
      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div foo="a:A:2:b:B:2"></div>'
      );
    });

    test('renders directives on PropertyParts', () => {
      render(html`<div .foo=${count('A')}></div>`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
      assert.strictEqual((container.firstElementChild as any).foo, 'A:1');
    });

    test('event listeners can see events fired in attribute directives', () => {
      class FireEventDirective {
        render() {
          return nothing;
        }
        // TODO (justinfagnani): make this work on SpreadPart
        update(part: AttributePart) {
          part.__element.dispatchEvent(
            new CustomEvent('test-event', {
              bubbles: true,
            })
          );
          return nothing;
        }
      }
      const fireEvent = directive(FireEventDirective);
      let event = undefined;
      const listener = (e: Event) => {
        event = e;
      };
      render(
        html`<div @test-event=${listener} b=${fireEvent()}></div>`,
        container
      );
      assert.isOk(event);
    });
  });
});
