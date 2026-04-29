/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import {assert} from 'chai';
import {LitElement, html, css} from 'lit';

class MyElement extends LitElement {
  private _internals: ElementInternals;

  static style = css`
    :host {
      display: block;
    }
  `;

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._internals.role = 'application';
    this._internals.ariaLabel = 'foo';
    this._internals.ariaRoleDescription = 'bar';
  }

  override render() {
    return html`<div>Foo</div>`;
  }
}

// Define custom elements once before the test suite runs
customElements.define('my-element', MyElement);

suite(`ssr client hydration support`, () => {
  let container: HTMLElement;
  let el: MyElement;

  setup(async () => {
    container = document.createElement('div');

    // Simulate SSR-rendered HTML with defer-hydration
    container.setHTMLUnsafe(`
        <my-element defer-hydration
          aria-label="foo" hydrate-internals-aria-label="foo"
          aria-roledescription="bar" hydrate-internals-aria-roledescription="bar"
          role="application" hydrate-internals-role="application">
          <template shadowroot="open" shadowrootmode="open">
            <style>:host{display:block}</style>
            <!--lit-part T5fUn6aagr0=--><div>Foo</div><!--/lit-part-->
          </template>
        </my-element>
        `);

    document.body.appendChild(container);

    el = document.querySelector('my-element')!;
  });

  teardown(() => {
    container?.remove();
  });

  test('defer-hydration state', async () => {
    assert.equal(el.hasAttribute('defer-hydration'), true);
    assert.equal(el.getAttribute('aria-label'), 'foo');
    assert.equal(el.getAttribute('hydrate-internals-aria-label'), 'foo');
    assert.equal(el.getAttribute('aria-roledescription'), 'bar');
    assert.equal(
      el.getAttribute('hydrate-internals-aria-roledescription'),
      'bar'
    );
    assert.equal(el.getAttribute('role'), 'application');
    assert.equal(el.getAttribute('hydrate-internals-role'), 'application');
  });

  test('attributes are removed after hydration', async () => {
    el.removeAttribute('defer-hydration');
    await el.updateComplete;

    assert.equal(el.getAttribute('aria-label'), null);
    assert.equal(el.getAttribute('aria-roledescription'), null);
    assert.equal(el.getAttribute('role'), null);
    assert.equal(el.getAttribute('hydrate-internals-aria-label'), null);
    assert.equal(
      el.getAttribute('hydrate-internals-aria-roledescription'),
      null
    );
    assert.equal(el.getAttribute('hydrate-internals-role'), null);
  });
});
