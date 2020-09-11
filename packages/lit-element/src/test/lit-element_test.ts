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

import {html, LitElement} from '../lib/lit-element.js';
import {property} from '../lib/decorators.js';
import {stripExpressionComments} from 'lit-html/development/test/test-utils/strip-markers.js';
import {generateElementName} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

// tslint:disable:no-any ok in tests

suite('LitElement', () => {
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

  test('renders initial content into shadowRoot', async () => {
    const rendered = `hello world`;
    const name = generateElementName();
    customElements.define(
      name,
      class extends LitElement {
        render() {
          return html`${rendered}`;
        }
      }
    );
    const el = document.createElement(name);
    container.appendChild(el);
    await new Promise((resolve) => {
      setTimeout(() => {
        assert.ok(el.shadowRoot);
        assert.equal(
          stripExpressionComments(el.shadowRoot!.innerHTML),
          rendered
        );
        resolve();
      });
    });
  });

  test('can set render target to light dom', async () => {
    const rendered = `hello world`;
    const name = generateElementName();
    customElements.define(
      name,
      class extends LitElement {
        render() {
          return html`${rendered}`;
        }

        createRenderRoot() {
          return this;
        }
      }
    );
    const el = document.createElement(name);
    container.appendChild(el);
    await (el as LitElement).updateComplete;
    assert.notOk(el.shadowRoot);
    assert.equal(stripExpressionComments(el.innerHTML), rendered);
  });

  test('renders when created via constructor', async () => {
    const rendered = `hello world`;
    class E extends LitElement {
      render() {
        return html`${rendered}`;
      }
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.ok(el.shadowRoot);
    assert.equal(stripExpressionComments(el.shadowRoot!.innerHTML), rendered);
  });

  // TODO(sorvell): Renable when lit-next supports this.
  test.skip('updates/renders attributes, properties, and event listeners via `lit-html`', async () => {
    class E extends LitElement {
      _event?: Event;

      render() {
        const attr = 'attr';
        const prop = 'prop';
        const event = function (this: E, e: Event) {
          this._event = e;
        };
        return html`<div attr="${attr}" .prop="${prop}" @zug="${event}"></div>`;
      }
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    const d = el.shadowRoot!.querySelector('div')!;
    assert.equal(d.getAttribute('attr'), 'attr');
    assert.equal((d as any).prop, 'prop');
    const e = new Event('zug');
    d.dispatchEvent(e);
    assert.equal(el._event, e);
  });

  // TODO(sorvell): Renable when lit-next supports this.
  test.skip('event listeners are invoked with the right `this` value', async () => {
    class E extends LitElement {
      event?: Event;

      render() {
        return html`<div @test=${this.onTest}></div>`;
      }

      onTest(e: Event) {
        this.event = e;
      }
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    const div = el.shadowRoot!.querySelector('div')!;
    const event = new Event('test');
    div.dispatchEvent(event);
    assert.equal(el.event, event);
  });

  // TODO(sorvell): Renable when lit-next supports this.
  test.skip('can set properties and attributes on sub-element', async () => {
    class E extends LitElement {
      static get properties() {
        return {foo: {}, attr: {}, bool: {type: Boolean}};
      }
      foo = 'hi';
      bool = false;

      render() {
        return html`${this.foo}`;
      }
    }
    customElements.define('x-2448', E);

    class F extends LitElement {
      inner: E | null = null;

      static get properties() {
        return {bar: {}, bool: {type: Boolean}};
      }
      bar = 'outer';
      bool = false;

      render() {
        return html`<x-2448
          .foo="${this.bar}"
          attr="${this.bar}"
          .bool="${this.bool}"
        ></x-2448>`;
      }

      firstUpdated() {
        this.inner = this.shadowRoot!.querySelector('x-2448');
      }

      get updateComplete() {
        return super.updateComplete.then(() => this.inner!.updateComplete);
      }
    }
    customElements.define(generateElementName(), F);
    const el = new F();
    container.appendChild(el);
    await el.updateComplete;
    assert.equal(el.inner!.shadowRoot!.textContent, 'outer');
    assert.equal((el.inner! as any).attr, 'outer');
    assert.equal(el.inner!.getAttribute('attr'), 'outer');
    assert.equal(el.inner!.bool, false);
    el.bar = 'test';
    el.bool = true;
    await el.updateComplete;
    assert.equal(el.inner!.shadowRoot!.textContent, 'test');
    assert.equal((el.inner! as any).attr, 'test');
    assert.equal(el.inner!.getAttribute('attr'), 'test');
    assert.equal(el.inner!.bool, true);
  });

  test('adds a version number', () => {
    assert.equal(window['litElementVersions'].length, 1);
  });

  // TODO(sorvell): Renable when lit-next supports this.
  test.skip('event fired during rendering element can trigger an update', async () => {
    class E extends LitElement {
      connectedCallback() {
        super.connectedCallback();
        this.dispatchEvent(
          new CustomEvent('foo', {bubbles: true, detail: 'foo'})
        );
      }
    }
    customElements.define('x-child-61012', E);

    class F extends LitElement {
      static get properties() {
        return {foo: {type: String}};
      }

      foo = '';

      render() {
        return html`<x-child-61012 @foo=${this._handleFoo}></x-child-61012
          ><span>${this.foo}</span>`;
      }

      _handleFoo(e: CustomEvent) {
        this.foo = e.detail;
      }
    }

    customElements.define(generateElementName(), F);
    const el = new F();
    container.appendChild(el);
    while (!(await el.updateComplete)) {}
    assert.equal(el.shadowRoot!.textContent, 'foo');
  });

  test('exceptions in `render` throw but do not prevent further updates', async () => {
    let shouldThrow = false;
    class A extends LitElement {
      @property() foo = 5;
      updatedFoo = 0;

      render() {
        if (shouldThrow) {
          throw new Error('test error');
        }
        return html`${this.foo}`;
      }
    }
    customElements.define(generateElementName(), A);
    const a = new A();
    container.appendChild(a);
    await a.updateComplete;
    assert.equal(a.shadowRoot!.textContent, '5');
    shouldThrow = true;
    a.foo = 10;
    let threw = false;
    try {
      await a.updateComplete;
    } catch (e) {
      threw = true;
    }
    assert.isTrue(threw);
    assert.equal(a.foo, 10);
    assert.equal(a.shadowRoot!.textContent, '5');
    shouldThrow = false;
    a.foo = 20;
    await a.updateComplete;
    assert.equal(a.foo, 20);
    assert.equal(a.shadowRoot!.textContent, '20');
  });

  test('if `render` is unimplemented, do not overwrite renderRoot', async () => {
    class A extends LitElement {
      addedDom: HTMLElement | null = null;
      createRenderRoot() {
        return this;
      }
    }
    customElements.define(generateElementName(), A);
    const a = new A();
    const testDom = document.createElement('div');
    a.appendChild(testDom);
    container.appendChild(a);
    await a.updateComplete;
    assert.equal(
      testDom.parentNode,
      a,
      'testDom should be a child of the component'
    );
  });
});
