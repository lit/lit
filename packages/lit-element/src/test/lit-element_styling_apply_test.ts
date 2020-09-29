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

import '@webcomponents/shadycss/apply-shim.min.js';
import '../lib/polyfill.js';

import {html as htmlWithStyles, LitElement} from '../lit-element.js';

import {
  generateElementName,
  getComputedStyleValue,
  nextFrame,
} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

// TODO(sorvell): Enable when polyfill support is available.
suite('Styling @apply', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('@apply renders in nested elements', async () => {
    customElements.define(
      'x-inner2',
      class extends LitElement {
        render() {
          return htmlWithStyles`
        <style>
          div {
            @apply --bag;
          }
        </style>
        <div>Testing...</div>`;
        }
      }
    );
    const name = generateElementName();
    class E extends LitElement {
      inner: LitElement | null = null;
      render() {
        return htmlWithStyles`
        <style>
          x-inner2 {
            --bag: {
              border: 10px solid red;
            }
          }
        </style>
        <x-inner2></x-inner2>`;
      }

      firstUpdated() {
        this.inner = this.shadowRoot!.querySelector('x-inner2') as LitElement;
      }
    }
    customElements.define(name, E);
    const el = document.createElement(name) as E;
    container.appendChild(el);

    // Workaround for Safari 9 Promise timing bugs.
    (await el.updateComplete) && (await el.inner!.updateComplete);

    await nextFrame();
    const div = el
      .shadowRoot!.querySelector('x-inner2')!
      .shadowRoot!.querySelector('div');
    assert.equal(
      getComputedStyleValue(div!, 'border-top-width').trim(),
      '10px'
    );
  });

  test('@apply renders in nested elements when sub-element renders separately first', async () => {
    class I extends LitElement {
      render() {
        return htmlWithStyles`
        <style>
          :host {
            display: block;
            width: 100px;
            height: 100px;
            border: 2px solid black;
            margin-top: 10px;
            @apply --bag;
          }
        </style>Hi`;
      }
    }
    customElements.define('x-applied', I);

    const name = generateElementName();
    class E extends LitElement {
      applied: HTMLElement | undefined;

      render() {
        return htmlWithStyles`
        <style>
          :host {
            --bag: {
              border: 10px solid black;
              margin-top: 2px;
            }
          }
        </style>
        <x-applied></x-applied>`;
      }

      firstUpdated() {
        this.applied = this.shadowRoot!.querySelector(
          'x-applied'
        ) as LitElement;
      }
    }
    customElements.define(name, E);

    const firstApplied = document.createElement('x-applied') as I;
    container.appendChild(firstApplied);
    const el = document.createElement(name) as E;
    container.appendChild(el);

    // Workaround for Safari 9 Promise timing bugs.
    (await firstApplied.updateComplete) &&
      el.updateComplete &&
      (await (el.applied as I).updateComplete);

    await nextFrame();
    assert.equal(
      getComputedStyleValue(firstApplied, 'border-top-width').trim(),
      '2px'
    );
    assert.equal(
      getComputedStyleValue(firstApplied, 'margin-top').trim(),
      '10px'
    );
    assert.equal(
      getComputedStyleValue(el.applied!, 'border-top-width').trim(),
      '10px'
    );
    assert.equal(
      getComputedStyleValue(el.applied!, 'margin-top').trim(),
      '2px'
    );
  });
});
