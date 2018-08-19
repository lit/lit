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

import {html, render} from '../../lib/shady-render.js';

const assert = chai.assert;

declare global {
  interface Window {
    ShadyDOM: any;  // tslint:disable-line
  }
}

suite('shady-render', () => {
  test('style elements apply in shadowRoots', () => {
    const container = document.createElement('div');
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
    render(result, container.shadowRoot!, 'scope-1');
    const div = (container.shadowRoot!).querySelector('div');
    assert.equal(
        getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
        '2px');
    document.body.removeChild(container);
  });

  test('style elements apply in  shadowRoots in nested templates', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
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
    render(result, container.shadowRoot!, 'scope-2');
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

  test('styles with css custom properties render', () => {
    const container = document.createElement('scope-4');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
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
    render(result, container.shadowRoot!, 'scope-4');
    const div = (container.shadowRoot!).querySelector('div');
    assert.equal(
        getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
        '2px');
    document.body.removeChild(container);
  });

  test('parts around styles with parts render/update', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
    const renderTemplate =
        (border: string, a: string, b: string, c: string) => {
          const result = html`<div id="a">${a}</div>
        <style>
          div {
            border: ${border};
          }
        </style><div id="b">${b}</div>
        <div id="c">${c}</div>
      `;
          render(result, container.shadowRoot!, 'scope-3a');
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
    // Note: Under Shady DOM, we do not expect this style part to update,
    // but under native Shadow DOM, we do.
    const stylePartValue =
        (typeof window.ShadyDOM === 'undefined' || !window.ShadyDOM.inUse) ?
        '2px' :
        '1px';
    assert.equal(
        getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
        stylePartValue);
    document.body.removeChild(container);
  });

  test('part values render into styles once per scope', function() {
    if (typeof window.ShadyDOM === 'undefined' || !window.ShadyDOM.inUse) {
      this.skip();
    }
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
    const renderTemplate = (border: string) => {
      const result = html`
        <style>
          div {
            border: ${border};
          }
        </style>
        <div>Testing...</div>
      `;
      render(result, container.shadowRoot as DocumentFragment, 'scope-3');
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

  test('warns if ShadyCSS version incorrect', function() {
    if (typeof window.ShadyCSS === 'undefined') {
      this.skip();
    }
    let warnCount = 0;
    const warn = window.console.warn;
    window.console.warn = function() {
      warnCount++;
      warn.apply(window.console, arguments);
    };
    const fn = window.ShadyCSS.prepareTemplateDom;
    window.ShadyCSS.prepareTemplateDom = undefined;

    const container = document.createElement('div');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
    const result = html`
      <style>
        div {
          border: 1px solid red;
        }
      </style>
      <div>Testing...</div>
    `;
    render(result, container.shadowRoot as DocumentFragment, 'scope-4');
    assert.isAbove(warnCount, 0);
    window.ShadyCSS.prepareTemplateDom = fn;
    window.console.warn = warn;
    document.body.removeChild(container);
  });
});
