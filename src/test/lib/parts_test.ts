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

import {AttributeCommitter, AttributePart, createMarker, DefaultTemplateProcessor, EventPart, html, NodePart, render, templateFactory, TemplateResult} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

// tslint:disable:no-any OK in test code.

suite('Parts', () => {
  suite('AttributePart', () => {
    let element: HTMLElement;
    let committer: AttributeCommitter;
    let part: AttributePart;

    setup(() => {
      element = document.createElement('div');
      committer = new AttributeCommitter(element, 'foo', ['', '']);
      part = committer.parts[0];
    });

    suite('setValue', () => {
      test(
          'does not dirty the committer when setting the same value twice',
          () => {
            part.setValue('bar');
            part.commit();
            assert.equal(element.getAttribute('foo'), 'bar');
            part.setValue('bar');
            assert.equal(committer.dirty, false);
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
      startNode = createMarker();
      endNode = createMarker();
      container.appendChild(startNode);
      container.appendChild(endNode);
      part = new NodePart({templateFactory});
      part.startNode = startNode;
      part.endNode = endNode;
    });

    suite('setValue', () => {
      test('accepts a string', () => {
        part.setValue('foo');
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), 'foo');
      });

      test('accepts a number', () => {
        part.setValue(123);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');
      });

      test('accepts undefined', () => {
        part.setValue(undefined);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '');
      });

      test('accepts null', () => {
        part.setValue(null);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '');
      });

      test('accepts a function', () => {
        const f = () => {
          throw new Error();
        };
        part.setValue(f);
        part.commit();
      });

      test('accepts an element', () => {
        part.setValue(document.createElement('p'));
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '<p></p>');
      });

      test('accepts arrays', () => {
        part.setValue([1, 2, 3]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');
        assert.strictEqual<Node>(container.firstChild!, startNode);
        assert.strictEqual<Node>(container.lastChild!, endNode);
      });

      test('accepts an empty array', () => {
        part.setValue([]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '');
        assert.strictEqual<Node>(container.firstChild!, startNode);
        assert.strictEqual<Node>(container.lastChild!, endNode);
      });

      test('accepts nested arrays', () => {
        part.setValue([1, [2], 3]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');
        assert.deepEqual(
            Array.from(container.childNodes).map((n) => n.nodeValue),
            ['', '', '1', '', '', '2', '', '', '3', '', '']);
        assert.strictEqual<Node>(container.firstChild!, startNode);
        assert.strictEqual<Node>(container.lastChild!, endNode);
      });

      test('accepts nested templates', () => {
        part.setValue(html`<h1>${'foo'}</h1>`);
        part.commit();
        assert.equal(
            stripExpressionMarkers(container.innerHTML), '<h1>foo</h1>');
      });

      test('accepts arrays of nested templates', () => {
        part.setValue([1, 2, 3].map((i) => html`${i}`));
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');
      });

      test('accepts an array of elements', () => {
        const children = [
          document.createElement('p'),
          document.createElement('a'),
          document.createElement('span')
        ];
        part.setValue(children);
        part.commit();
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<p></p><a></a><span></span>');
      });

      test('nested TemplateResults use their own processor', () => {
        // TODO (justinfagnani): rewrite to not use render(), but use NodePart
        // directly like the other tests here
        class TestTemplateProcessor extends DefaultTemplateProcessor {
          handleAttributeExpressions(
              element: Element, name: string, strings: string[]) {
            if (name[0] === '&') {
              return super.handleAttributeExpressions(
                  element, name.slice(1), strings, {templateFactory});
            }
            return super.handleAttributeExpressions(
                element, name, strings, {templateFactory});
          }
        }
        const processor = new TestTemplateProcessor();
        const testHtml = (strings: TemplateStringsArray, ...values: any[]) =>
            new TemplateResult(strings, values, 'html', processor);

        render(html`${testHtml`<div &foo="${'foo'}"></div>`}`, container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<div foo="foo"></div>');
      });

      test('updates a simple value to a complex one', () => {
        let value: string|TemplateResult = 'foo';
        const t = () => html`<div>${value}</div>`;
        render(t(), container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

        value = html`<span>bar</span>`;
        render(t(), container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<div><span>bar</span></div>');
      });

      test('updates a complex value to a simple one', () => {
        let value: string|TemplateResult = html`<span>bar</span>`;
        const t = () => html`<div>${value}</div>`;
        render(t(), container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<div><span>bar</span></div>');

        value = 'foo';
        render(t(), container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
      });

      test('updates when called multiple times with simple values', () => {
        part.setValue('abc');
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), 'abc');
        part.setValue('def');
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), 'def');
      });

      test('updates when called multiple times with arrays', () => {
        part.setValue([1, 2, 3]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');
        assert.deepEqual(
            Array.from(container.childNodes).map((n) => n.nodeValue),
            ['', '', '1', '', '2', '', '3', '', '']);
        assert.strictEqual<Node>(container.firstChild!, startNode);
        assert.strictEqual<Node>(container.lastChild!, endNode);

        part.setValue([]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '');
        assert.deepEqual(
            Array.from(container.childNodes).map((n) => n.nodeValue), ['', '']);
        assert.strictEqual<Node>(container.firstChild!, startNode);
        assert.strictEqual<Node>(container.lastChild!, endNode);
      });

      test('updates when called multiple times with arrays 2', () => {
        part.setValue([1, 2, 3]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');
        assert.deepEqual(
            Array.from(container.childNodes).map((n) => n.nodeValue),
            ['', '', '1', '', '2', '', '3', '', '']);
        assert.strictEqual<Node>(container.firstChild!, startNode);
        assert.strictEqual<Node>(container.lastChild!, endNode);

        part.setValue([4, 5]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '45');
        assert.deepEqual(
            Array.from(container.childNodes).map((n) => n.nodeValue),
            ['', '', '4', '', '5', '', '']);
        assert.strictEqual<Node>(container.firstChild!, startNode);
        assert.strictEqual<Node>(container.lastChild!, endNode);

        part.setValue([]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '');
        assert.deepEqual(
            Array.from(container.childNodes).map((n) => n.nodeValue), ['', '']);
        assert.strictEqual<Node>(container.firstChild!, startNode);
        assert.strictEqual<Node>(container.lastChild!, endNode);

        part.setValue([4, 5]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '45');
        assert.deepEqual(
            Array.from(container.childNodes).map((n) => n.nodeValue),
            ['', '', '4', '', '5', '', '']);
        assert.strictEqual<Node>(container.firstChild!, startNode);
        assert.strictEqual<Node>(container.lastChild!, endNode);
      });

      test('updates nested arrays', () => {
        part.setValue([1, [2], 3]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');
        assert.deepEqual(
            Array.from(container.childNodes).map((n) => n.nodeValue),
            ['', '', '1', '', '', '2', '', '', '3', '', '']);
        assert.strictEqual<Node>(container.firstChild!, startNode);
        assert.strictEqual<Node>(container.lastChild!, endNode);

        part.setValue([[1], 2, 3]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');
        assert.deepEqual(
            Array.from(container.childNodes).map((n) => n.nodeValue),
            ['', '', '', '1', '', '', '2', '', '3', '', '']);
        assert.strictEqual<Node>(container.firstChild!, startNode);
        assert.strictEqual<Node>(container.lastChild!, endNode);
      });

      test('updates arrays with siblings', () => {
        let items = [1, 2, 3];
        const t = () => html`<p></p>${items}<a></a>`;

        render(t(), container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML), '<p></p>123<a></a>');

        items = [1, 2, 3, 4];
        render(t(), container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML), '<p></p>1234<a></a>');
      });

      test(
          'updates are stable when called multiple times with templates',
          () => {
            let value = 'foo';
            const r = () => html`<h1>${value}</h1>`;
            part.setValue(r());
            part.commit();
            assert.equal(
                stripExpressionMarkers(container.innerHTML), '<h1>foo</h1>');
            const originalH1 = container.querySelector('h1');

            value = 'bar';
            part.setValue(r());
            part.commit();
            assert.equal(
                stripExpressionMarkers(container.innerHTML), '<h1>bar</h1>');
            const newH1 = container.querySelector('h1');
            assert.strictEqual(newH1, originalH1);
          });

      test(
          'updates are stable when called multiple times with arrays of templates',
          () => {
            let items = [1, 2, 3];
            const r = () => items.map((i) => html`<li>${i}</li>`);
            part.setValue(r());
            part.commit();
            assert.equal(
                stripExpressionMarkers(container.innerHTML),
                '<li>1</li><li>2</li><li>3</li>');
            const originalLIs = Array.from(container.querySelectorAll('li'));

            items = [3, 2, 1];
            part.setValue(r());
            part.commit();
            assert.equal(
                stripExpressionMarkers(container.innerHTML),
                '<li>3</li><li>2</li><li>1</li>');
            const newLIs = Array.from(container.querySelectorAll('li'));
            assert.deepEqual(newLIs, originalLIs);
          });
    });

    suite('insertAfterNode', () => {
      test(
          'inserts part and sets values between ref node and its next sibling',
          () => {
            const testEndNode = createMarker();
            container.appendChild(testEndNode);
            const testPart = new NodePart({templateFactory});
            testPart.insertAfterNode(endNode);
            assert.equal(testPart.startNode, endNode);
            assert.equal(testPart.endNode, testEndNode);
            const text = document.createTextNode('');
            testPart.setValue(text);
            testPart.commit();
            assert.deepEqual(
                Array.from(container.childNodes),
                [startNode, endNode, text, testEndNode]);
          });
    });

    suite('appendIntoPart', () => {
      test(
          'inserts part and sets values between ref node and its next sibling',
          () => {
            const testPart = new NodePart({templateFactory});
            testPart.appendIntoPart(part);
            assert.instanceOf(testPart.startNode, Comment);
            assert.instanceOf(testPart.endNode, Comment);
            const text = document.createTextNode('');
            testPart.setValue(text);
            testPart.commit();
            assert.deepEqual(Array.from(container.childNodes), [
              startNode,
              testPart.startNode,
              text,
              testPart.endNode,
              endNode,
            ]);

            const parentText = document.createTextNode('');
            part.setValue(parentText);
            part.commit();
            assert.deepEqual(Array.from(container.childNodes), [
              startNode,
              parentText,
              endNode,
            ]);
          });
    });

    suite('insertAfterPart', () => {
      test('inserts part and sets values after another part', () => {
        const testPart = new NodePart({templateFactory});
        testPart.insertAfterPart(part);
        assert.instanceOf(testPart.startNode, Comment);
        assert.equal(testPart.endNode, endNode);
        const text = document.createTextNode('');
        testPart.setValue(text);
        testPart.commit();
        assert.deepEqual(
            Array.from(container.childNodes),
            [startNode, testPart.startNode, text, endNode]);

        const previousText = document.createTextNode('');
        part.setValue(previousText);
        part.commit();
        assert.deepEqual(
            Array.from(container.childNodes),
            [startNode, previousText, testPart.startNode, text, endNode]);
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

  suite('EventPart', () => {
    let part: EventPart;
    let element: HTMLElement;

    // Detect event options support
    let eventOptionsSupported = false;
    let captureSupported = false;
    let passiveSupported = false;
    let onceSupported = false;

    try {
      const options = {
        get capture() {
          eventOptionsSupported = true;
          captureSupported = true;
          return false;
        },
        get passive() {
          eventOptionsSupported = true;
          passiveSupported = true;
          return false;
        },
        get once() {
          eventOptionsSupported = true;
          onceSupported = true;
          return false;
        },
      };
      window.addEventListener('test', options as any, options);
      window.removeEventListener('test', options as any, options);
    } catch (_e) {
    }

    setup(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    test('supports event listener options on functions', () => {
      console.log('eventOptionsSupported', eventOptionsSupported);
      console.log('captureSupported', captureSupported);
      console.log('passiveSupported', passiveSupported);
      console.log('onceSupported', onceSupported);
      part = new EventPart(element, 'click');
      let listenerCalled = false;
      let captureCalled = false;
      let passiveCalled = false;
      let onceCalled = false;

      const listener = (_e: Event) => {
        listenerCalled = true;
      };
      Object.defineProperties(listener, {
        capture: {
          get() {
            captureCalled = true;
          }
        },
        passive: {
          get() {
            passiveCalled = true;
          }
        },
        once: {
          get() {
            onceCalled = true;
          }
        }
      });

      part.setValue(listener);
      part.commit();
      element.click();
      assert.isTrue(listenerCalled, 'listenerCalled');
      assert.isTrue(captureCalled, 'captureCalled');
      if (passiveSupported) {
        assert.isTrue(passiveCalled, 'passiveCalled');
      }
      if (onceSupported) {
        assert.isTrue(onceCalled, 'onceCalled');
      }
    });

    test('supports event listener options on objects', () => {
      part = new EventPart(element, 'click');
      let listenerCalled = false;
      let captureCalled = false;
      let passiveCalled = false;
      let onceCalled = false;

      const listener = {
        handleEvent(_e: Event) {
          listenerCalled = true;
        },
        get capture() {
          captureCalled = true;
          return undefined;
        },
        get passive() {
          passiveCalled = true;
          return undefined;
        },
        get once() {
          onceCalled = true;
          return undefined;
        }
      };

      part.setValue(listener);
      part.commit();
      element.click();
      assert.isTrue(listenerCalled, 'listenerCalled');
      assert.isTrue(captureCalled, 'captureCalled');
      if (passiveSupported) {
        assert.isTrue(passiveCalled, 'passiveCalled');
      }
      if (onceSupported) {
        assert.isTrue(onceCalled, 'onceCalled');
      }
    });
  });
});
