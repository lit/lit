/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '@webcomponents/shadycss/apply-shim.min.js';
import 'lit-element/polyfill-support.js';

import {html as htmlWithStyles, LitElement, css} from 'lit-element';

import {
  canTestLitElement,
  generateElementName,
  getComputedStyleValue,
  nextFrame,
} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

(canTestLitElement ? suite : suite.skip)('Styling @apply', () => {
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
        override render() {
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
      override render() {
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

      override firstUpdated() {
        this.inner = this.shadowRoot!.querySelector('x-inner2') as LitElement;
      }
    }
    customElements.define(name, E);
    const testInstance = async () => {
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
    };
    await testInstance();
    await testInstance();
    await testInstance();
  });

  test('part values correct when @apply is used in multiple instances', async () => {
    customElements.define(
      'x-inner3',
      class extends LitElement {
        override render() {
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
      div!: HTMLDivElement;

      override render() {
        return htmlWithStyles`
        <style>
          div {
            border: 4px solid blue;
          }
          x-inner3 {
            --bag: {
              border: 10px solid red;
            }
          }
        </style>
        Outer Element
        <div ?some-attr="${true}">${'Button Text'}</div>
        <x-inner3></x-inner3>`;
      }

      override firstUpdated() {
        this.inner = this.shadowRoot!.querySelector('x-inner3') as LitElement;
        this.div = this.shadowRoot!.querySelector('div') as HTMLDivElement;
      }
    }
    customElements.define(name, E);

    const testInstance = async () => {
      const el = document.createElement(name) as E;
      container.appendChild(el);

      // Workaround for Safari 9 Promise timing bugs.
      (await el.updateComplete) && (await el.inner!.updateComplete);
      await nextFrame();
      await new Promise((r) => setTimeout(r, 100));
      const div = el
        .shadowRoot!.querySelector('x-inner3')!
        .shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '10px'
      );
      assert.ok(el.div.hasAttribute('some-attr'));
      assert.equal(el.div.textContent, 'Button Text');
    };
    await testInstance();
    await testInstance();
    await testInstance();
  });

  test('@apply renders in nested elements when sub-element renders separately first', async () => {
    class I extends LitElement {
      override render() {
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

      override render() {
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

      override firstUpdated() {
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

  test('content shadowRoot is styled via static get styles in multiple instances', async () => {
    const name = generateElementName();
    customElements.define(
      name,
      class extends LitElement {
        static override get styles() {
          return [
            css`
              div {
                border: 2px solid blue;
              }
            `,
            css`
              span {
                display: block;
                border: 3px solid blue;
              }
            `,
          ];
        }

        override render() {
          return htmlWithStyles`
        <div>Testing1</div>
        <span>Testing2</span>`;
        }
      }
    );
    const testInstance = async () => {
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as LitElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
      const span = el.shadowRoot!.querySelector('span');
      assert.equal(
        getComputedStyleValue(span!, 'border-top-width').trim(),
        '3px'
      );
    };
    // test multiple instances
    await testInstance();
    await testInstance();
    await testInstance();
  });
});
