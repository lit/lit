/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {css, html as htmlWithStyles, LitElement} from 'lit-element';
import {html as staticHtml, unsafeStatic} from 'lit-html/static.js';

import {
  canTestLitElement,
  generateElementName,
  getComputedStyleValue,
  nextFrame,
} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

(canTestLitElement ? suite : suite.skip)('Styling', () => {
  suite('Basic styling', () => {
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

    test('content shadowRoot is styled', async () => {
      const name = generateElementName();
      customElements.define(
        name,
        class extends LitElement {
          override render() {
            return htmlWithStyles`
          <style>
            div {
              border: 2px solid blue;
            }
          </style>
          <div>Testing...</div>`;
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as LitElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
    });

    test('shared styling rendered into shadowRoot is styled', async () => {
      const style = htmlWithStyles`<style>
        div {
          border: 4px solid blue;
        }
      </style>`;
      const name = generateElementName();
      customElements.define(
        name,
        class extends LitElement {
          override render() {
            return htmlWithStyles`
          <style>
            div {
              border: 2px solid blue;
            }
          </style>
          ${style}
          <div>Testing...</div>`;
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as LitElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '4px'
      );
    });

    test('custom properties render', async () => {
      const name = generateElementName();
      customElements.define(
        name,
        class extends LitElement {
          override render() {
            return htmlWithStyles`
          <style>
            :host {
              --border: 8px solid red;
            }
            div {
              border: var(--border);
            }
          </style>
          <div>Testing...</div>`;
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as LitElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '8px'
      );
    });

    test('custom properties flow to nested elements', async () => {
      customElements.define(
        'x-inner',
        class extends LitElement {
          override render() {
            return htmlWithStyles`
          <style>
            div {
              border: var(--border);
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
            x-inner {
              --border: 8px solid red;
            }
          </style>
          <x-inner></x-inner>`;
        }

        override firstUpdated() {
          this.inner = this.shadowRoot!.querySelector('x-inner')! as LitElement;
        }
      }
      customElements.define(name, E);
      const el = document.createElement(name) as E;
      container.appendChild(el);

      // Workaround for Safari 9 Promise timing bugs.
      (await el.updateComplete) && (await el.inner!.updateComplete);

      await nextFrame();
      const div = el.inner!.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '8px'
      );
    });

    test('elements with custom properties can move between elements', async () => {
      customElements.define(
        'x-inner1',
        class extends LitElement {
          override render() {
            return htmlWithStyles`
          <style>
            div {
              border: var(--border);
            }
          </style>
          <div>Testing...</div>`;
          }
        }
      );
      const name1 = generateElementName();
      customElements.define(
        name1,
        class extends LitElement {
          inner: Element | null = null;

          override render() {
            return htmlWithStyles`
          <style>
            x-inner1 {
              --border: 2px solid red;
            }
          </style>
          <x-inner1></x-inner1>`;
          }

          override firstUpdated() {
            this.inner = this.shadowRoot!.querySelector('x-inner1');
          }
        }
      );
      const name2 = generateElementName();
      customElements.define(
        name2,
        class extends LitElement {
          override render() {
            return htmlWithStyles`
          <style>
            x-inner1 {
              --border: 8px solid red;
            }
          </style>`;
          }
        }
      );
      const el = document.createElement(name1) as LitElement;
      const el2 = document.createElement(name2);
      container.appendChild(el);
      container.appendChild(el2);

      // Workaround for Safari 9 Promise timing bugs.
      await el.updateComplete;

      await nextFrame();
      const inner = el.shadowRoot!.querySelector('x-inner1');
      const div = inner!.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
      el2.shadowRoot!.appendChild(inner!);

      // Workaround for Safari 9 Promise timing bugs.
      await el.updateComplete;

      await nextFrame();
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '8px'
      );
    });
  });

  suite('Static get styles', () => {
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

    test('styles in render compose with `static get styles`', async () => {
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
          <style>
            div {
              padding: 4px;
            }
            span {
              display: block;
              border: 4px solid blue;
            }
          </style>
          <div>Testing1</div>
          <span>Testing2</span>`;
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as LitElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
      assert.equal(getComputedStyleValue(div!, 'padding-top').trim(), '4px');
      const span = el.shadowRoot!.querySelector('span');
      assert.equal(
        getComputedStyleValue(span!, 'border-top-width').trim(),
        '3px'
      );
      // Verify there is one scoping style under ShadyDOM
      if (window.ShadyDOM?.inUse) {
        assert.equal(
          document.querySelectorAll(`style[scope=${name}`).length,
          1
        );
      }
    });
  });

  suite('ShadyDOM', () => {
    let container: HTMLElement;

    setup(function () {
      if (!window.ShadyDOM) {
        this.skip();
      } else {
        container = document.createElement('div');
        document.body.appendChild(container);
      }
    });

    teardown(() => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    test('static properties in styles render with initial value and cannot be changed', async () => {
      let border = `6px solid blue`;
      const name = generateElementName();
      customElements.define(
        name,
        class extends LitElement {
          override render() {
            return staticHtml`
          <style>
            div {
              border: ${unsafeStatic(border)};
            }
          </style>
          <div>Testing...</div>`;
          }
        }
      );
      const el = document.createElement(name) as LitElement;
      container.appendChild(el);
      await el.updateComplete;
      let div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '6px'
      );
      border = `4px solid orange`;
      el.requestUpdate();
      await el.updateComplete;
      div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '6px'
      );
    });
  });
});
