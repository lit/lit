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

import {html} from '../../lit-html.js';
import {renderShadowRoot} from '../test-utils/shadow-root.js';

const assert = chai.assert;

// tslint:disable:no-any OK in test code.

suite('shady-render', () => {
  test('style elements apply in shadowRoots', () => {
    const container = document.createElement('scope-1');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
    const result = html`
      <style>
        div {
          border: 2px solid blue;
        }
      </style>
      <div>Testing...</div>
    `;
    renderShadowRoot(result, container);
    const div = (container.shadowRoot!).querySelector('div');
    assert.equal(
        getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
        '2px');
    document.body.removeChild(container);
  });

  test('style elements apply in shadowRoots in nested templates', () => {
    const container = document.createElement('scope-2');
    document.body.appendChild(container);
    const result = html`
      <style>
        div {
          border: 4px solid orange;
        }
      </style>
      <div>Testing...</div>
      ${html`
        <style>
          span {
            border: 5px solid tomato;
          }
        </style>
        <span>Testing...</span>
      `}
    `;
    renderShadowRoot(result, container);
    const div = (container.shadowRoot!).querySelector('div');
    assert.equal(
        getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
        '4px');
    const span = (container.shadowRoot!).querySelector('span');
    assert.equal(
        getComputedStyle(span!).getPropertyValue('border-top-width').trim(),
        '5px');
    document.body.removeChild(container);
  });

  test('results render to multiple containers', () => {
    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    document.body.appendChild(container1);
    document.body.appendChild(container2);
    const getResult = (data: any) => html`${data.a}-${data.b}-${data.c}`;
    renderShadowRoot(getResult({a: 1, b: 2, c: 3}), container1);
    renderShadowRoot(getResult({a: 4, b: 5, c: 6}), container2);
    assert.equal(container1.shadowRoot!.textContent, '1-2-3');
    assert.equal(container2.shadowRoot!.textContent, '4-5-6');
    renderShadowRoot(getResult({a: 11, b: 22, c: 33}), container1);
    renderShadowRoot(getResult({a: 44, b: 55, c: 66}), container2);
    assert.equal(container1.shadowRoot!.textContent, '11-22-33');
    assert.equal(container2.shadowRoot!.textContent, '44-55-66');
    document.body.removeChild(container1);
    document.body.removeChild(container2);
  });

  test('multiple renders re-use rendered DOM', () => {
    const container = document.createElement('scope-re-use');
    document.body.appendChild(container);
    const renderTemplate = (a: string) => {
      const result = html`
            <div id="a">${a}</div>
      `;
      renderShadowRoot(result, container);
    };
    renderTemplate('a');
    const renderedNode = container.shadowRoot!.querySelector('#a');
    renderTemplate('b');
    assert.equal(container.shadowRoot!.querySelector('#a'), renderedNode);
    document.body.removeChild(container);
  });

  test('styles with css custom properties render', () => {
    const container = document.createElement('scope-4');
    document.body.appendChild(container);
    const result = html`
      <style>
        :host {
          --border: 2px solid orange;
        }
        div {
          border: var(--border);
        }
      </style>
      <div>Testing...</div>
    `;
    renderShadowRoot(result, container);
    const div = (container.shadowRoot!).querySelector('div');
    assert.equal(
        getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
        '2px');
    document.body.removeChild(container);
  });

  test(
      'styles with css custom properties flow to nested shadowRoots',
      async () => {
        const shadowContent = html`
          <style>
            :host {
              display: block;
              border: var(--border);
            }
          </style>
          <div>Testing...</div>
        `;

        const container = document.createElement('scope-4a');
        document.body.appendChild(container);
        const result = html`
      <style>
        :host {
          --border: 2px solid orange;
        }
      </style>
      <scope-4a-sub></scope-4a-sub>
    `;
        renderShadowRoot(result, container);
        const e = (container.shadowRoot!).querySelector('scope-4a-sub')!;
        renderShadowRoot(shadowContent, e);
        assert.equal(
            getComputedStyle(e!).getPropertyValue('border-top-width').trim(),
            '2px');
        document.body.removeChild(container);
      });

  test(
      'styles with css custom properties flow to multiple instances of nested shadowRoots',
      async () => {
        const nestedContent = html`
            <style>
              :host {
                display: block;
                border: var(--border);
              }
            </style>
            <div>Testing...</div>
          `;

        const container = document.createElement('scope-4b');
        document.body.appendChild(container);
        renderShadowRoot(
            html`
          <style>
            :host {
              --border: 2px solid orange;
            }
          </style>
          <scope-4b-sub></scope-4b-sub>
          <scope-4b-sub></scope-4b-sub>
        `,
            container);
        const elements =
            (container.shadowRoot!).querySelectorAll('scope-4b-sub');
        renderShadowRoot(nestedContent, elements[0]!);
        renderShadowRoot(nestedContent, elements[1]!);
        assert.equal(
            getComputedStyle(elements[0]!)
                .getPropertyValue('border-top-width')
                .trim(),
            '2px');
        assert.equal(
            getComputedStyle(elements[1]!)
                .getPropertyValue('border-top-width')
                .trim(),
            '2px');
        document.body.removeChild(container);
      });

  test('parts around styles with parts render/update', () => {
    const container = document.createElement('scope-3a');
    document.body.appendChild(container);
    const renderTemplate =
        (border: string, a: string, b: string, c: string) => {
          const result = html`<style></style><div id="a">${a}</div>
        <style>
          div {
            border: ${border};
          }
        </style><div id="b">${b}</div>
        <style></style>
        <div id="c">${c}</div>
        <style></style>
      `;
          renderShadowRoot(result, container);
        };
    renderTemplate('1px solid black', 'a', 'b', 'c');
    const shadowRoot = container.shadowRoot!;
    assert.equal(shadowRoot.querySelector('#a')!.textContent, `a`);
    assert.equal(shadowRoot.querySelector('#b')!.textContent, `b`);
    assert.equal(shadowRoot.querySelector('#c')!.textContent, `c`);
    const div = shadowRoot.querySelector('div');
    assert.equal(
        getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
        '1px');
    renderTemplate('2px solid black', 'a1', 'b1', 'c1');
    assert.equal(shadowRoot.querySelector('#a')!.textContent, `a1`);
    assert.equal(shadowRoot.querySelector('#b')!.textContent, `b1`);
    assert.equal(shadowRoot.querySelector('#c')!.textContent, `c1`);
    // Style parts do not update.
    assert.equal(
        getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
        '1px');
    document.body.removeChild(container);
  });

  test(
      'parts around styles with parts render/update when stamped into muliple containers',
      () => {
        const container = document.createElement('scope-3b');
        document.body.appendChild(container);
        const renderTemplate =
            (border: string,
             a: string,
             b: string,
             c: string,
             host = container) => {
              const result = html`<style></style><div id="a">${a}</div>
        <style>
          div {
            border: ${border};
          }
        </style><div id="b">${b}</div>
        <style></style>
        <div id="c">${c}</div>
        <style></style>
      `;
              renderShadowRoot(result, host);
            };
        // create a dummy element first
        renderTemplate(
            '1px solid black', '', '', '', document.createElement('scope-3b'));
        // then test the 2nd element made for this scope
        renderTemplate('1px solid black', 'a', 'b', 'c');
        const shadowRoot = container.shadowRoot!;
        assert.equal(shadowRoot.querySelector('#a')!.textContent, `a`);
        assert.equal(shadowRoot.querySelector('#b')!.textContent, `b`);
        assert.equal(shadowRoot.querySelector('#c')!.textContent, `c`);
        const div = shadowRoot.querySelector('div');
        assert.equal(
            getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
            '1px');
        renderTemplate('2px solid black', 'a1', 'b1', 'c1');
        assert.equal(shadowRoot.querySelector('#a')!.textContent, `a1`);
        assert.equal(shadowRoot.querySelector('#b')!.textContent, `b1`);
        assert.equal(shadowRoot.querySelector('#c')!.textContent, `c1`);
        // Style parts do not update.
        assert.equal(
            getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
            '1px');
        document.body.removeChild(container);
      });

  test('part values render into styles once per scope', function() {
    if (typeof window.ShadyDOM === 'undefined' || !window.ShadyDOM.inUse) {
      this.skip();
    }
    const container = document.createElement('scope-3');
    document.body.appendChild(container);
    const renderTemplate = (border: string) => {
      const result = html`
        <style>
          div {
            border: ${border};
          }
        </style>
        <div>Testing...</div>
      `;
      renderShadowRoot(result, container);
    };
    renderTemplate('1px solid black');
    const div = (container.shadowRoot!).querySelector('div');
    assert.equal(
        getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
        '1px');
    renderTemplate('2px solid black');
    assert.equal(
        getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
        '1px');
    document.body.removeChild(container);
  });
});
