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


/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />

const assert = chai.assert;

suite('shady-render', () => {

  test('styles elements rendered into shadowRoots', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
    render(html`
      <style>
        div {
          border: 2px solid blue;
        }
      </style>
      <div>Testing...</div>
    `, container.shadowRoot!, 'scope-1');
    const div = (container.shadowRoot!).querySelector('div');
    assert.equal(getComputedStyle(div!).getPropertyValue('border-top-width').trim(), '2px');
    document.body.removeChild(container);
  });

  test('styles elements rendred into shadowRoots in nested templates', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
    render(html`
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
    `, container.shadowRoot!, 'scope-2');
    const div = (container.shadowRoot!).querySelector('div');
    assert.equal(getComputedStyle(div!).getPropertyValue('border-top-width').trim(), '4px');
    const span = (container.shadowRoot!).querySelector('span');
    assert.equal(getComputedStyle(span!).getPropertyValue('border-top-width').trim(), '5px');
    document.body.removeChild(container);
  });

  test('part values render into styles once per scope', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
    const renderTemplate = (border: string) => {
      render(html`
        <style>
          div {
            border: ${border};
          }
        </style>
        <div>Testing...</div>
      `, container.shadowRoot as DocumentFragment, 'scope-3');
    }
    renderTemplate('1px solid black');
    const div = (container.shadowRoot!).querySelector('div');
    assert.equal(getComputedStyle(div!).getPropertyValue('border-top-width').trim(), '1px');
    renderTemplate('2px solid black');
    assert.equal(getComputedStyle(div!).getPropertyValue('border-top-width').trim(), '1px');
    document.body.removeChild(container);
  });

  test('parts around styles with parts render/update', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
    const renderTemplate = (border: string, a: string, b: string, c: string) => {
      render(html`<div id="a">${a}</div>
        <style>
          div {
            border: ${border};
          }
        </style><div id="b">${b}</div>
        <div id="c">${c}</div>
      `, container.shadowRoot!, 'scope-3a');
    }
    renderTemplate('1px solid black', 'a', 'b', 'c');
    const shadowRoot = container.shadowRoot!;
    assert.equal(shadowRoot.querySelector('#a')!.textContent, `a`);
    assert.equal(shadowRoot.querySelector('#b')!.textContent, `b`);
    assert.equal(shadowRoot.querySelector('#c')!.textContent, `c`);
    const div = shadowRoot.querySelector('div');
    assert.equal(getComputedStyle(div!).getPropertyValue('border-top-width').trim(), '1px');
    renderTemplate('2px solid black', 'a1', 'b1', 'c1');
    assert.equal(shadowRoot.querySelector('#a')!.textContent, `a1`);
    assert.equal(shadowRoot.querySelector('#b')!.textContent, `b1`);
    assert.equal(shadowRoot.querySelector('#c')!.textContent, `c1`);
    assert.equal(getComputedStyle(div!).getPropertyValue('border-top-width').trim(), '1px');
    document.body.removeChild(container);
  });

  test('styles with css custom properties render', () => {
    const container = document.createElement('scope-4');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
    render(html`
      <style>
        :host {
          --border: 2px solid orange;
        }
        div {
          border: var(--border);
        }
      </style>
      <div>Testing...</div>
    `, container.shadowRoot!, 'scope-4');
    const div = (container.shadowRoot!).querySelector('div');
    assert.equal(getComputedStyle(div!).getPropertyValue('border-top-width').trim(), '2px');
    document.body.removeChild(container);
  });

  test('styles with css custom properties using @apply render', () => {
    const container = document.createElement('scope-5');
    document.body.appendChild(container);
    container.attachShadow({mode: 'open'});
    render(html`
      <style>
        :host {
          --batch: {
            border: 3px solid orange;
            padding: 4px;
          };
        }
        div {
          @apply --batch;
        }
      </style>
      <div>Testing...</div>
    `, container.shadowRoot!, 'scope-5');
    const div = (container.shadowRoot!).querySelector('div');
    const computedStyle = getComputedStyle(div!);
    assert.equal(computedStyle.getPropertyValue('border-top-width').trim(), '3px');
    assert.equal(computedStyle.getPropertyValue('padding-top').trim(), '4px');
    document.body.removeChild(container);
  });

});
