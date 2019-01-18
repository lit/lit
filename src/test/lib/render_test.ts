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

import {AttributePart, directive, html, noChange, NodePart, nothing, Part, render, svg, templateFactory} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

// tslint:disable:no-any OK in test code.

const isTemplatePolyfilled =
    ((HTMLTemplateElement as any).decorate != null ||
     (window as any).ShadyDOM && (window as any).ShadyDOM.inUse);
const testSkipForTemplatePolyfill = isTemplatePolyfilled ? test.skip : test;

const isSafari10_0 =
    (window.navigator.userAgent.indexOf('AppleWebKit/602') === -1);
const testSkipSafari10_0 = isSafari10_0 ? test : test.skip;

const isChrome41 = (window.navigator.userAgent.indexOf('Chrome/41') === -1);
const testSkipChrome41 = isChrome41 ? test : test.skip;

const testIfHasSymbol = (window as any).Symbol === undefined ? test.skip : test;

const ua = window.navigator.userAgent;
const isIe = ua.indexOf('Trident/') > 0;

suite('render()', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  suite('text', () => {
    test('renders plain text expression', () => {
      render(html`test`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'test');
    });

    test('renders a string', () => {
      render(html`<div>${'foo'}</div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
    });

    test('renders a number', () => {
      render(html`<div>${123}</div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>123</div>');
    });

    test('renders undefined', () => {
      render(html`<div>${undefined}</div>`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    });

    test('renders null', () => {
      render(html`<div>${null}</div>`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    });

    test('renders noChange', () => {
      const template = (i: any) => html`<div>${i}</div>`;
      render(template('foo'), container);
      render(template(noChange), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
    });

    test('renders nothing', () => {
      const template = (i: any) => html`<div>${i}</div>`;
      render(template('foo'), container);
      render(template(nothing), container);
      const children = Array.from(container.querySelector('div')!.childNodes);
      assert.isEmpty(
          children.filter((node) => node.nodeType !== Node.COMMENT_NODE));
    });

    testIfHasSymbol('renders a Symbol', () => {
      render(html`<div>${Symbol('A')}</div>`, container);
      assert.include(
          container.querySelector('div')!.textContent!.toLowerCase(), 'symbol');
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
          stripExpressionMarkers(container.innerHTML), '<div>123</div>');
    });

    test('renders nested templates', () => {
      const partial = html`<h1>${'foo'}</h1>`;
      render(html`${partial}${'bar'}`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<h1>foo</h1>bar');
    });

    test('renders parts with whitespace after them', () => {
      render(html`<div>${'foo'} </div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>foo </div>');
    });

    test('renders multiple parts per element, preserving whitespace', () => {
      render(html`<div>${'foo'} ${'bar'}</div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>foo bar</div>');
    });

    test('values contain interpolated values', () => {
      const t = html`${'a'},${'b'},${'c'}`;
      render(t, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'a,b,c');
    });

    test('renders a template nested multiple times', () => {
      const partial = html`<h1>${'foo'}</h1>`;
      render(html`${partial}${'bar'}${partial}${'baz'}qux`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<h1>foo</h1>bar<h1>foo</h1>bazqux');
    });

    test('renders arrays of nested templates', () => {
      render(html`<div>${[1, 2, 3].map((i) => html`${i}`)}</div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>123</div>');
    });

    // TODO(justinfagnani): add this test back with a test TemplateProcessor and
    // html tag.
    test.skip(
        'overwrites an existing (plain) TemplateInstance if one exists, ' +
            'even if it has a matching Template',
        () => {
          const t = (tag: any) => tag`<div>foo</div>`;

          render(t(html), container);

          assert.equal(container.children.length, 1);
          const firstDiv = container.children[0];
          assert.equal(firstDiv.textContent, 'foo');

          render(t(html), container);

          assert.equal(container.children.length, 1);
          const secondDiv = container.children[0];
          assert.equal(secondDiv.textContent, 'foo');

          assert.notEqual(firstDiv, secondDiv);
        });

    test('renders an element', () => {
      const child = document.createElement('p');
      render(html`<div>${child}</div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div><p></p></div>');
    });

    test('renders an array of elements', () => {
      const children = [
        document.createElement('p'),
        document.createElement('a'),
        document.createElement('span')
      ];
      render(html`<div>${children}</div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div><p></p><a></a><span></span></div>');
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
          stripExpressionMarkers(container.innerHTML),
          '<form><input name="one"><input name="two"></form>');
    });

    test('renders SVG', () => {
      const container = document.createElement('svg');
      const t = svg`<line y1="1" y2="1"/>`;
      render(t, container);
      const line = container.firstElementChild!;
      assert.equal(line.tagName, 'line');
      assert.equal(line.namespaceURI, 'http://www.w3.org/2000/svg');
    });

    test('renders SVG with bindings', () => {
      const container = document.createElement('svg');
      const pathDefinition = 'M7 14l5-5 5 5z';
      const t = svg`<path d="${pathDefinition}" />`;
      render(t, container);
      const path = container.firstElementChild as SVGPathElement;
      // IE and Edge rewrite paths, so check a normalized value too
      assert.include(
          ['M7 14l5-5 5 5z', 'M 7 14 l 5 -5 l 5 5 Z'],
          path.getAttribute('d'),
          pathDefinition);
    });

    test('renders templates with comments', () => {
      const t = html`
        <div>
          <!-- this is a comment -->
          <h1 class="${'foo'}">title</h1>
          <p>${'foo'}</p>
        </div>`;
      render(t, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
        <div>
          <!-- this is a comment -->
          <h1 class="foo">title</h1>
          <p>foo</p>
        </div>`);
    });

    test('renders comments with bindings', () => {
      const t = html`
        <!-- <div class="${'foo'}"></div> -->
        <p>${'bar'}</p>`;
      render(t, container);
      assert.equal(container.querySelector('p')!.textContent, 'bar');
    });

    test('renders comments with multiple bindings', () => {
      const t = html`
        <!-- <div class="${'foo'}">${'bar'}</div> -->
        <p>${'baz'}</p>`;
      render(t, container);
      assert.equal(container.querySelector('p')!.textContent, 'baz');
    });

    test('renders legacy marker sequences in text nodes', () => {
      // {{}} used to be the marker text and it was important to test that
      // markers in user-templates weren't interpreted as expressions
      const result = html`{{}}`;
      assert.equal(templateFactory(result).parts.length, 0);
      render(result, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '{{}}');
    });

    test('renders expressions with preceding elements', () => {
      render(html`<a>${'foo'}</a>${html`<h1>${'bar'}</h1>`}`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<a>foo</a><h1>bar</h1>');

      // This is nearly the same test case as above, but was causing a
      // different stack trace
      render(html`<a>${'foo'}</a>${'bar'}`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<a>foo</a>bar');
    });
  });

  suite('attributes', () => {
    test('renders to an attribute', () => {
      render(html`<div foo="${'bar'}"></div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div foo="bar"></div>');
    });

    testIfHasSymbol('renders a Symbol to an attribute', () => {
      render(html`<div foo=${Symbol('A')}></div>`, container);
      assert.include(
          container.querySelector('div')!.getAttribute('foo')!.toLowerCase(),
          'symbol');
    });

    testIfHasSymbol('renders a Symbol in an array to an attribute', () => {
      render(html`<div foo=${[Symbol('A')]}></div>`, container);
      assert.include(
          container.querySelector('div')!.getAttribute('foo')!.toLowerCase(),
          'symbol');
    });

    test('renders multiple bindings in an attribute', () => {
      render(html`<div foo="a${'b'}c${'d'}e"></div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div foo="abcde"></div>');
    });

    test('renders two attributes on one element', () => {
      const result = html`<div a="${1}" b="${2}"></div>`;
      render(result, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div a="1" b="2"></div>');
    });

    test('renders a binding in a style attribute', () => {
      const t = html`<div style="color: ${'red'}"></div>`;
      render(t, container);
      if (isIe) {
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<div style="color: red;"></div>');
      } else {
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<div style="color: red"></div>');
      }
    });

    test('renders multiple bindings in a style attribute', () => {
      const t = html`<div style="${'color'}: ${'red'}"></div>`;
      render(t, container);
      if (isIe) {
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<div style="color: red;"></div>');
      } else {
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<div style="color: red"></div>');
      }
    });

    test('renders a binding in a class attribute', () => {
      render(html`<div class="${'red'}"></div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div class="red"></div>');
    });

    test('renders a binding in an input value attribute', () => {
      render(html`<input value="${'the-value'}">`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<input value="the-value">');
      assert.equal(container.querySelector('input')!.value, 'the-value');
    });

    test('renders a case-sensitive attribute', () => {
      const size = 100;
      render(html`<svg viewBox="0 0 ${size} ${size}"></svg>`, container);
      assert.include(
          stripExpressionMarkers(container.innerHTML), 'viewBox="0 0 100 100"');

      // Make sure non-alpha valid attribute name characters are handled
      render(html`<svg view_Box="0 0 ${size} ${size}"></svg>`, container);
      assert.include(
          stripExpressionMarkers(container.innerHTML),
          'view_Box="0 0 100 100"');
    });

    test(
        'renders to an attribute expression after an attribute literal', () => {
          render(html`<div a="b" foo="${'bar'}"></div>`, container);
          // IE and Edge can switch attribute order!
          assert.include(
              ['<div a="b" foo="bar"></div>', '<div foo="bar" a="b"></div>'],
              stripExpressionMarkers(container.innerHTML));
        });

    test(
        'renders to an attribute expression before an attribute literal',
        () => {
          render(html`<div foo="${'bar'}" a="b"></div>`, container);
          // IE and Edge can switch attribute order!
          assert.include(
              ['<div a="b" foo="bar"></div>', '<div foo="bar" a="b"></div>'],
              stripExpressionMarkers(container.innerHTML));
        });

    // Regression test for exception in template parsing caused by attributes
    // reordering when a attribute binding precedes an attribute literal.
    test('renders attribute binding after attribute binding that moved', () => {
      render(
          html`<a href="${'foo'}" class="bar"><div id=${'a'}></div></a>`,
          container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          `<a class="bar" href="foo"><div id="a"></div></a>`);
    });

    test('renders to an attribute without quotes', () => {
      render(html`<div foo=${'bar'}></div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div foo="bar"></div>');
    });

    test('renders to multiple attribute expressions', () => {
      render(
          html`<div foo="${'Foo'}" bar="${'Bar'}" baz=${'Baz'}></div>`,
          container);
      assert.oneOf(stripExpressionMarkers(container.innerHTML), [
        '<div foo="Foo" bar="Bar" baz="Baz"></div>',
        '<div foo="Foo" baz="Baz" bar="Bar"></div>'
      ]);
    });

    test('renders to attributes with attribute-like values', () => {
      render(html`<div foo="bar=${'foo'}"></div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div foo="bar=foo"></div>');
    });

    test('renders interpolation to an attribute', () => {
      render(html`<div foo="1${'bar'}2${'baz'}3"></div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
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
          stripExpressionMarkers(container.innerHTML), '<div foo="123"></div>');
    });

    test('renders to an attribute before a node', () => {
      render(html`<div foo="${'bar'}">${'baz'}</div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div foo="bar">baz</div>');
    });

    test('renders to an attribute after a node', () => {
      render(html`<div>${'baz'}</div><div foo="${'bar'}"></div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div>baz</div><div foo="bar"></div>');
    });

    test('renders undefined in attributes', () => {
      render(html`<div attribute="it's ${undefined}"></div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div attribute="it\'s undefined"></div>');
    });
  });

  suite('properties', () => {
    test('sets properties', () => {
      render(html`<div .foo=${123} .bar=${456}></div>`, container);
      const div = container.querySelector('div')!;
      assert.strictEqual((div as any).foo, 123);
      assert.strictEqual((div as any).bar, 456);
    });
  });

  suite('boolean attributes', () => {
    test('renders a boolean attribute as an empty string when truthy', () => {
      const t = (value: any) => html`<div ?foo="${value}"></div>`;

      render(t(true), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div foo=""></div>');

      render(t('a'), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div foo=""></div>');

      render(t(1), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div foo=""></div>');
    });

    test('removes a boolean attribute when falsey', () => {
      const t = (value: any) => html`<div ?foo="${value}"></div>`;

      render(t(false), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      render(t(0), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      render(t(null), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      render(t(undefined), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
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
      let event: Event;
      const listener = function(this: any, e: any) {
        event = e;
        thisValue = this;
      };
      const eventContext = {} as EventTarget;
      render(html`<div @click=${listener}></div>`, container, {eventContext});
      const div = container.querySelector('div')!;
      div.click();
      assert.equal(thisValue, eventContext);

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
      const eventContext = {} as EventTarget;
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

    test(
        'allows updating event listener without extra calls to remove/addEventListener',
        () => {
          let listener: Function|null;
          const t = () => html`<div @click=${listener}></div>`;
          render(t(), container);
          const div = container.querySelector('div')!;

          let addCount = 0;
          let removeCount = 0;
          div.addEventListener = () => addCount++;
          div.removeEventListener = () => removeCount++;

          listener = () => {};
          render(t(), container);
          assert.equal(addCount, 1);
          assert.equal(removeCount, 0);

          listener = () => {};
          render(t(), container);
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
          <div id="inner"><div>
        </div>
      `,
          container);
      const inner = container.querySelector('#inner')!;
      inner.dispatchEvent(new Event('test'));
      assert.isOk(event);
      assert.equal(eventPhase, Event.CAPTURING_PHASE);
    });
  });

  suite('directives', () => {
    test('renders directives on NodeParts', () => {
      const fooDirective = directive(() => (part: Part) => {
        part.setValue('foo');
      });

      render(html`<div>${fooDirective()}</div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
    });

    test('renders directives on AttributeParts', () => {
      const fooDirective = directive(() => (part: AttributePart) => {
        part.setValue('foo');
      });

      render(html`<div foo="${fooDirective()}"></div>`, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div foo="foo"></div>');
    });

    test('renders directives on PropertyParts', () => {
      const fooDirective = directive(() => (part: AttributePart) => {
        part.setValue(1234);
      });

      render(html`<div .foo="${fooDirective()}"></div>`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
      assert.strictEqual((container.firstElementChild as any).foo, 1234);
    });

    testSkipChrome41(
        'event listeners can see events fired by dynamic children', () => {
          // This tests that node directives are called in the commit phase, not
          // the setValue phase
          let event: Event|undefined = undefined;
          document.body.appendChild(container);
          render(
              html`
        <div @test-event=${(e: Event) => {
                event = e;
              }}>
          ${directive(() => (part: NodePart) => {
                // This emulates a custom element that fires an event in its
                // connectedCallback
                part.startNode.dispatchEvent(new CustomEvent('test-event', {
                  bubbles: true,
                }));
              })()}
        </div>`,
              container);
          document.body.removeChild(container);
          assert.isOk(event);
        });

    test(
        'event listeners can see events fired directives in AttributeParts',
        () => {
          // This tests that attribute directives are called in the commit
          // phase, not the setValue phase
          let event = undefined;
          const fire = directive(() => (part: AttributePart) => {
            part.committer.element.dispatchEvent(new CustomEvent('test-event', {
              bubbles: true,
            }));
          });

          render(
              html`<div @test-event=${(e: Event) => {
                event = e;
              }} b=${fire()}></div>`,
              container);
          assert.isOk(event);
        });
  });

  suite('<table>', () => {
    testSkipForTemplatePolyfill(
        'renders nested templates within table content', () => {
          let table = html`<table>${html`<tr>${html`<td></td>`}</tr>`}</table>`;
          render(table, container);
          assert.equal(
              stripExpressionMarkers(container.innerHTML),
              '<table><tr><td></td></tr></table>');

          table = html`<tbody>${html`<tr></tr>`}</tbody>`;
          render(table, container);
          assert.equal(
              stripExpressionMarkers(container.innerHTML),
              '<tbody><tr></tr></tbody>');

          table = html`<table><tr></tr>${html`<tr></tr>`}</table>`;
          render(table, container);
          assert.equal(
              stripExpressionMarkers(container.innerHTML),
              '<table><tbody><tr></tr><tr></tr></tbody></table>');

          table = html`<table><tr><td></td>${html`<td></td>`}</tr></table>`;
          render(table, container);
          assert.equal(
              stripExpressionMarkers(container.innerHTML),
              '<table><tbody><tr><td></td><td></td></tr></tbody></table>');

          table = html`<table><tr><td></td>${html`<td></td>`}${
              html`<td></td>`}</tr></table>`;
          render(table, container);
          assert.equal(
              stripExpressionMarkers(container.innerHTML),
              '<table><tbody><tr><td></td><td></td><td></td></tr></tbody></table>');
        });

    // On Safari 10.0 (but not 10.1), the attribute value "<table>" is
    // escaped to "&lt;table&gt;". That shouldn't cause this test to
    // fail, so we skip
    testSkipSafari10_0(
        'renders quoted attributes with "<table>" before an expression', () => {
          const template = html`<div a="<table>${'foo'}"></div>`;
          render(template, container);
          assert.equal(
              stripExpressionMarkers(container.innerHTML),
              `<div a="<table>foo"></div>`);
        });
  });

  suite('<style>', () => {
    test('renders no comments inside textContent', () => {
      render(html`<style>${''}</style>`, container);
      assert.equal(container.firstElementChild!.textContent, '');
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
      assert.equal(stripExpressionMarkers(container.innerHTML), `
        <style>
          h1 {
            color: red;
          }
        </style>`);
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
      assert.equal(stripExpressionMarkers(container.innerHTML), `
              <style>
                .foo {
                  background: black;
                }
              </style>
              <a href="/buy/foo"></a>
            `);
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
      assert.equal(stripExpressionMarkers(container.innerHTML), `
          <style>bar</style>
          <a href="/buy/foo"></a>
        `);
    });
  });

  suite('<template>', () => {
    test('bindings work in <template>', () => {
      const t = (a: string, b: string) => html`
        <template>
          <span>${a}</span>
        </template>
        <div>${b}</div>
      `;
      render(t('1', '2'), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
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
      assert.equal(stripExpressionMarkers(container.innerHTML), `
        <template foo="1">
          <span>2</span>
        </template>
        <div>3</div>
      `);
    });
  });

  suite('text and attributes', () => {
    test('renders attributes bindings after text bindings', () => {
      render(
          html`
        <div>${''}</div>
        <div foo=${'bar'}></div>
      `,
          container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
        <div></div>
        <div foo="bar"></div>
      `);
    });
    test('renders a combination of stuff', () => {
      render(
          html`
          <div foo="${'bar'}">
            ${'baz'}
            <p>${'qux'}</p>
          </div>`,
          container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
          <div foo="bar">
            baz
            <p>qux</p>
          </div>`);
    });
  });

  const suiteIfCustomElementsAreSupported =
      (window.customElements != null) ? suite : suite.skip;

  suiteIfCustomElementsAreSupported('custom elements', () => {
    class PropertySetterElement extends HTMLElement {
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
    customElements.define('property-tester', PropertySetterElement);

    teardown(() => {
      if (container.parentElement === document.body) {
        document.body.removeChild(container);
      }
    });

    test('uses property setters for custom elements', () => {
      // Container must be in the document for the custom element to upgrade
      document.body.appendChild(container);
      render(
          html`<property-tester .value=${'foo'}></property-tester>`, container);
      const instance = container.firstElementChild as PropertySetterElement;
      assert.equal(instance.value, 'foo');
      assert.isTrue(instance.calledSetter);
    });

    test('uses property setters for disconnected custom elements', () => {
      // Here we _don't_ connect the container to the document, to highlight
      // that we aren't creating upgraded custom elements in this case when we
      // ideally should be.
      render(
          html`<property-tester .value=${'foo'}></property-tester>`, container);
      const instance = container.firstElementChild as PropertySetterElement;
      assert.equal(instance.value, 'foo');
      assert.isTrue(instance.calledSetter);
    });

    test(
        'uses property setters in nested templates added after the initial render',
        () => {
          // Container must be in the document for the custom element to upgrade
          document.body.appendChild(container);
          const template = (content: any) => html`${content}`;

          // Do an initial render
          render(template('some content'), container);

          // Now update the rendered template, render a nested template
          const fragment =
              html`<property-tester .value=${'foo'}></property-tester>`;
          render(template(fragment), container);

          const instance = container.firstElementChild as PropertySetterElement;
          assert.equal(instance.value, 'foo');
          assert.isTrue(instance.calledSetter);
        });

    test(
        'uses property setters in disconnected nested templates added after the initial render',
        () => {
          // Here we _don't_ connect the container to the document, to highlight
          // that we aren't creating upgraded custom elements in this case when
          // we ideally should be.
          const template = (content: any) => html`${content}`;

          // Do an initial render
          render(template('some content'), container);

          // Now update the rendered template, render a nested template
          const fragment =
              html`<property-tester .value=${'foo'}></property-tester>`;
          render(template(fragment), container);

          const instance = container.firstElementChild as PropertySetterElement;
          assert.equal(instance.value, 'foo');
          assert.isTrue(instance.calledSetter);
        });
  });

  suite('updates', () => {
    let container: HTMLElement;

    setup(() => {
      container = document.createElement('div');
    });

    test('updates when called multiple times with arrays', () => {
      const ul = (list: string[]) => {
        const items = list.map((item) => html`<li>${item}</li>`);
        return html`<ul>${items}</ul>`;
      };
      render(ul(['a', 'b', 'c']), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<ul><li>a</li><li>b</li><li>c</li></ul>');
      render(ul(['x', 'y']), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<ul><li>x</li><li>y</li></ul>');
    });

    test('dirty checks simple values', () => {
      const foo = 'aaa';

      const t = () => html`<div>${foo}</div>`;

      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>aaa</div>');
      const text = container.querySelector('div')!;
      assert.equal(text.textContent, 'aaa');

      // Set textContent manually. Since lit-html doesn't dirty check against
      // actual DOM, but again previous part values, this modification should
      // persist through the next render with the same value.
      text.textContent = 'bbb';
      assert.equal(text.textContent, 'bbb');
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>bbb</div>');

      // Re-render with the same content, should be a no-op
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>bbb</div>');
      const text2 = container.querySelector('div')!;

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

      assert.equal(stripExpressionMarkers(container.innerHTML), '');
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      // Wait for mutation callback to be called
      await new Promise((resolve) => setTimeout(resolve));

      const elementNodes: Array<Node> = [];
      for (const record of mutationRecords) {
        elementNodes.push(...Array.from(record.addedNodes)
                              .filter((n) => n.nodeType === Node.ELEMENT_NODE));
      }
      assert.equal(elementNodes.length, 1);

      mutationRecords = [];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
      await new Promise((resolve) => setTimeout(resolve));
      assert.equal(mutationRecords.length, 0);
    });

    test('renders to and updates a container', () => {
      let foo = 'aaa';

      const t = () => html`<div>${foo}</div>`;

      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>aaa</div>');
      const div = container.querySelector('div')!;
      assert.equal(div.tagName, 'DIV');

      foo = 'bbb';
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>bbb</div>');
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
          stripExpressionMarkers(container.innerHTML), '<div>foobar</div>');

      foo = 'bbb';
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>bbbbar</div>');
    });

    test('renders and updates attributes', () => {
      let foo = 'foo';
      const bar = 'bar';

      const t = () => html`<div a="${foo}:${bar}"></div>`;

      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div a="foo:bar"></div>');

      foo = 'bbb';
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
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
          stripExpressionMarkers(container.innerHTML), '<h1>foo</h1>baz');

      foo = 'bbb';
      render(t(true), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<h1>bbb</h1>baz');

      render(t(false), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<h2>bar</h2>baz');
    });

    test('updates arrays', () => {
      let items = [1, 2, 3];
      const t = () => html`<div>${items}</div>`;
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>123</div>');

      items = [3, 2, 1];
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>321</div>');
    });

    test('updates arrays that shrink then grow', () => {
      let items: number[];
      const t = () => html`<div>${items}</div>`;

      items = [1, 2, 3];
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>123</div>');

      items = [4];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div>4</div>');

      items = [5, 6, 7];
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>567</div>');
    });

    test('updates an element', () => {
      let child: any = document.createElement('p');
      const t = () => html`<div>${child}<div></div></div>`;
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div><p></p><div></div></div>');

      child = undefined;
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<div><div></div></div>');

      child = document.createTextNode('foo');
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
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
          stripExpressionMarkers(container.innerHTML),
          '<div><p></p><a></a><span></span></div>');

      children = null;
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      children = document.createTextNode('foo');
      render(t(), container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
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

  suite('security', () => {
    function importToContainer(content: DocumentFragment) {
      const container = document.createElement('div');
      container.appendChild(document.importNode(content, true));
      return container;
    }

    test('resists XSS attempt in node values', () => {
      const result = html`<div>${'<script>alert("boo");</script>'}</div>`;
      const container =
          importToContainer(templateFactory(result).element.content);
      assert(container.innerHTML, '<div></div>');
    });

    test('resists XSS attempt in attribute values', () => {
      const result = html
      `<div foo="${'"><script>alert("boo");</script><div foo="'}"></div>`;
      const container =
          importToContainer(templateFactory(result).element.content);
      assert(container.innerHTML, '<div></div>');
    });
  });
});
