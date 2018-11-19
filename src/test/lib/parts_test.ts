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

import {AttributeCommitter, AttributePart, DefaultTemplateProcessor, DynamicNodePart, EventPart, html, render, StaticNodePart, templateFactory, TemplateResult} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

suite('Parts', () => {
  suite('NodePart', () => {
    let container: HTMLElement;

    setup(() => {
      container = document.createElement('div');
    });

    const createNodes = (n: number, t = 'n') => {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < n; i++) {
        frag.appendChild(document.createElement(`${t}${i}`));
      }
      return frag;
    };

    suite('static', () => {
      test('attach to parent node', () => {
        const part = new StaticNodePart({templateFactory});
        part.attach(container);
        part.setValue(createNodes(2));
        part.commit();
        assert.equal(
            stripExpressionMarkers(container.innerHTML), `<n0></n0><n1></n1>`);
        part.clear();
        assert.equal(stripExpressionMarkers(container.innerHTML), ``);
      });

      test('attach after sibling', () => {
        const start = container.appendChild(document.createElement('s'));
        const part = new StaticNodePart({templateFactory});
        part.attach(container, start);
        part.setValue(createNodes(2));
        part.commit();
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            `<s></s><n0></n0><n1></n1>`);
        part.clear();
        assert.equal(stripExpressionMarkers(container.innerHTML), `<s></s>`);
      });

      test('attach before sibling', () => {
        container.appendChild(document.createElement('e'));
        const part = new StaticNodePart({templateFactory});
        part.attach(container);
        part.setValue(createNodes(2));
        part.commit();
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            `<n0></n0><n1></n1><e></e>`);
        part.clear();
        assert.equal(stripExpressionMarkers(container.innerHTML), `<e></e>`);
      });

      test('attach between siblings', () => {
        const start = container.appendChild(document.createElement('s'));
        container.appendChild(document.createElement('e'));
        const part = new StaticNodePart({templateFactory});
        part.attach(container, start);
        part.setValue(createNodes(2));
        part.commit();
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            `<s></s><n0></n0><n1></n1><e></e>`);
        part.clear();
        assert.equal(
            stripExpressionMarkers(container.innerHTML), `<s></s><e></e>`);
      });
    });

    suite('dynamic', () => {
      let containerPart: StaticNodePart;

      setup(() => {
        const start = container.appendChild(document.createElement('s'));
        container.appendChild(document.createElement('e'));
        containerPart = new StaticNodePart({templateFactory});
        containerPart.attach(container, start);
      });

      const createParts = (n: number) => {
        let last = undefined;
        const ret: {[key: string]: DynamicNodePart} = {};
        for (let i = 0; i < n; i++) {
          const part = new DynamicNodePart({templateFactory});
          const name = String.fromCharCode('a'.charCodeAt(0) + i);
          part.attach(containerPart, last);
          part.setValue(createNodes(2, name));
          part.commit();
          ret[name] = part;
          last = part;
        }
        return ret;
      };

      const htmlForParts =
          (parts: {[key: string]: DynamicNodePart}, clearedPart?: string) =>
              `<s></s>` +
          Object.keys(parts)
              .filter((p) => (p) !== clearedPart)
              .map((p) => `<${p}0></${p}0><${p}1></${p}1>`)
              .join('') +
          `<e></e>`;

      const verifyParts = (parts: {[key: string]: DynamicNodePart}) => {
        assert.equal(
            stripExpressionMarkers(container.innerHTML), htmlForParts(parts));
        for (const p in parts) {
          parts[p].clear();
          assert.equal(
              stripExpressionMarkers(container.innerHTML),
              htmlForParts(parts, p));
          parts[p].setValue(createNodes(2, p));
          parts[p].commit();
          assert.equal(
              stripExpressionMarkers(container.innerHTML), htmlForParts(parts));
        }
      };

      suite('attach/detach', () => {
        test('attach to empty container part', () => {
          // Create & attach
          const {a} = createParts(1);
          verifyParts({a});
          // Detach
          a.detach();
          verifyParts({});
        });

        test('attach to container part after sibling part', () => {
          // Setup
          const {a} = createParts(1);
          verifyParts({a});
          // Create & attach
          const b = new DynamicNodePart({templateFactory});
          b.attach(containerPart, a);
          // Set
          b.setValue(createNodes(2, 'b'));
          b.commit();
          verifyParts({a, b});
          // Detach
          b.detach();
          verifyParts({a});
        });

        test('attach to container part before sibling part', () => {
          // Setup
          const {a} = createParts(1);
          verifyParts({a});
          // Create & attach
          const b = new DynamicNodePart({templateFactory});
          b.attach(containerPart);
          // Set
          b.setValue(createNodes(2, 'b'));
          b.commit();
          verifyParts({b, a});
          // Detach
          b.detach();
          verifyParts({a});
        });

        test('attach to container part between sibling parts', () => {
          // Setup
          const {a, b} = createParts(2);
          verifyParts({a, b});
          // Create & attach
          const c = new DynamicNodePart({templateFactory});
          c.attach(containerPart);
          // Set
          c.setValue(createNodes(2, 'c'));
          c.commit();
          verifyParts({c, a, b});
          // Detach
          c.detach();
          verifyParts({a, b});
        });
      });

      suite('move', () => {
        test('move part from beginning to end', () => {
          // Setup
          const {a, b, c} = createParts(3);
          verifyParts({a, b, c});
          // Move
          a.attach(containerPart, c);
          verifyParts({b, c, a});
        });

        test('move part from end to beginning', () => {
          // Setup
          const {a, b, c} = createParts(3);
          verifyParts({a, b, c});
          // Move
          c.attach(containerPart);
          verifyParts({c, a, b});
        });

        test('move part to after next part', () => {
          // Setup
          const {a, b, c, d} = createParts(4);
          verifyParts({a, b, c, d});
          // Move
          b.attach(containerPart, c);
          verifyParts({a, c, b, d});
        });

        test('move part to before previous part', () => {
          // Setup
          const {a, b, c, d} = createParts(4);
          verifyParts({a, b, c, d});
          // Move
          c.attach(containerPart, a);
          verifyParts({a, c, b, d});
        });

        test('move part from middle to beginning', () => {
          // Setup
          const {a, b, c, d} = createParts(4);
          verifyParts({a, b, c, d});
          // Move
          c.attach(containerPart);
          verifyParts({c, a, b, d});
        });

        test('move part from middle to end', () => {
          // Setup
          const {a, b, c, d} = createParts(4);
          verifyParts({a, b, c, d});
          // Move
          b.attach(containerPart, d);
          verifyParts({a, c, d, b});
        });
      });

      suite('detach (retain) & re-attach', () => {
        test('re-attach part from beginning to end', () => {
          // Setup
          const {a, b, c} = createParts(3);
          verifyParts({a, b, c});
          // Detach & retain
          a.detach(true);
          verifyParts({b, c});
          // Re-attach
          a.attach(containerPart, c);
          verifyParts({b, c, a});
        });

        test('re-attach part from end to beginning', () => {
          // Setup
          const {a, b, c} = createParts(3);
          verifyParts({a, b, c});
          // Detach & retain
          c.detach(true);
          verifyParts({a, b});
          // Re-attach
          c.attach(containerPart);
          verifyParts({c, a, b});
        });

        test('re-attach part to after next part', () => {
          // Setup
          const {a, b, c} = createParts(3);
          verifyParts({a, b, c});
          // Detach & retain
          b.detach(true);
          verifyParts({a, c});
          // Re-attach
          b.attach(containerPart, c);
          verifyParts({a, c, b});
        });

        test('re-attach part to before previous part', () => {
          // Setup
          const {a, b, c, d} = createParts(4);
          verifyParts({a, b, c, d});
          // Detach & retain
          c.detach(true);
          verifyParts({a, b, d});
          // Re-attach
          c.attach(containerPart, a);
          verifyParts({a, c, b, d});
        });

        test('re-attach part from middle to beginning', () => {
          // Setup
          const {a, b, c, d} = createParts(4);
          verifyParts({a, b, c, d});
          // Detach & retain
          c.detach(true);
          verifyParts({a, b, d});
          // Re-attach
          c.attach(containerPart);
          verifyParts({c, a, b, d});
        });

        test('re-attach part from middle to end', () => {
          // Setup
          const {a, b, c, d} = createParts(4);
          verifyParts({a, b, c, d});
          // Detach & retain
          b.detach(true);
          verifyParts({a, c, d});
          // Re-attach
          b.attach(containerPart, d);
          verifyParts({a, c, d, b});
        });
      });
    });
  });

  suite('AttributePart', () => {
    let element: HTMLElement;
    let committer: AttributeCommitter;
    let part: AttributePart;

    setup(() => {
      element = document.createElement('i');
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
    let part: StaticNodePart;

    setup(() => {
      container = document.createElement('div');
      part = new StaticNodePart({templateFactory});
      part.attach(container);
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
      });

      test('accepts an empty array', () => {
        part.setValue([]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '');
      });

      test('accepts nested arrays', () => {
        part.setValue([1, [2], 3]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');
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

        part.setValue([]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '');
      });

      test('updates when called multiple times with arrays 2', () => {
        part.setValue([1, 2, 3]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');

        part.setValue([4, 5]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '45');

        part.setValue([]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '');

        part.setValue([4, 5]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '45');
      });

      test('updates nested arrays', () => {
        part.setValue([1, [2], 3]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');

        part.setValue([[1], 2, 3]);
        part.commit();
        assert.equal(stripExpressionMarkers(container.innerHTML), '123');
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

    suite('clear', () => {
      test('is a no-op on an already empty range', () => {
        part.clear();
        assert.equal(stripExpressionMarkers(container.innerHTML), '');
      });

      test('clears a range', () => {
        container.appendChild(document.createTextNode('foo'));
        part.clear();
        assert.equal(stripExpressionMarkers(container.innerHTML), '');
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
