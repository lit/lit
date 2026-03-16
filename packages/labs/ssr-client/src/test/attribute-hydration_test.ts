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

class MyElementClosed extends MyElement {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    mode: 'closed',
  } as ShadowRootInit;
}
customElements.define('my-element-closed', MyElementClosed);

class InternalsOkElement extends LitElement {
  internals = this.attachInternals();
}
customElements.define('internals-ok', InternalsOkElement);

suite(`ssr client hydration support`, () => {
  let container: HTMLElement;
  let el: MyElement;

  // Simulate SSR-rendered HTML with defer-hydration
  const getTestElement = async (closed = false) => {
    container = document.createElement('div');
    const elementTag = closed ? 'my-element-closed' : 'my-element';
    const mode = closed ? 'closed' : 'open';
    container!.setHTMLUnsafe(`
        <${elementTag} defer-hydration
          aria-label="foo" hydrate-internals-aria-label="foo"
          aria-roledescription="bar" hydrate-internals-aria-roledescription="bar"
          role="application" hydrate-internals-role="application">
          <template shadowroot="${mode}" shadowrootmode="${mode}">
            <style>:host{display:block}</style>
            <!--lit-part T5fUn6aagr0=--><div>Foo</div><!--/lit-part-->
          </template>
        </${elementTag}>
        `);
    document.body.appendChild(container);
    return container.querySelector(elementTag)! as MyElement;
  };
  teardown(() => {
    container?.remove();
  });

  test('defer-hydration state', async () => {
    el = await getTestElement();
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

  test('internals are functional with hydration support', async () => {
    const el = document.createElement('internals-ok') as InternalsOkElement;
    document.body.appendChild(el);
    assert.ok(el.internals);
    assert.throws(() => el.attachInternals());
    el.remove();
  });

  test('shadowrootmode="open": attributes are removed after hydration', async () => {
    el = await getTestElement();
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

  test('shadowrootmode="closed": attributes are removed after hydration', async () => {
    el = await getTestElement(true);
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
