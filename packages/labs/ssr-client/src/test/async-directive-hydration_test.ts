/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import {assert} from 'chai';
import {LitElement, html} from 'lit';
import {ref} from 'lit/directives/ref.js';

// Records every value the `ref()` callback is called with, in order.
const refCalls: Array<Element | undefined> = [];
const refCallback = (el: Element | undefined) => {
  refCalls.push(el);
};

class RefHydrationElement extends LitElement {
  override render() {
    return html`<div ${ref(refCallback)}></div>`;
  }
}

// Define custom elements once before the test suite runs
customElements.define('ref-hydration-element', RefHydrationElement);

suite(`ssr client async directive hydration`, () => {
  let container: HTMLElement;
  let el: RefHydrationElement;
  let div: Element;

  const setupSsrHtml = () => {
    container = document.createElement('div');

    // Simulate SSR-rendered HTML with defer-hydration. The lit-part digest
    // is the digest of the `html`<div ${ref(...)}></div>` template.
    container.setHTMLUnsafe(`
        <ref-hydration-element defer-hydration>
          <template shadowroot="open" shadowrootmode="open"><!--lit-part liPcn9lj0Ak=--><!--lit-node 0--><div ></div><!--/lit-part--></template>
        </ref-hydration-element>
        `);

    el = container.querySelector('ref-hydration-element')!;
    div = el.shadowRoot!.querySelector('div')!;
  };

  setup(() => {
    refCalls.length = 0;
    setupSsrHtml();
  });

  teardown(() => {
    container?.remove();
  });

  const assertRefCalls = (expected: Array<Element | undefined>) => {
    assert.equal(refCalls.length, expected.length);
    expected.forEach((value, i) => assert.strictEqual(refCalls[i], value));
  };

  test('ref fires el -> undefined -> el across disconnect/reconnect', async () => {
    document.body.appendChild(container);

    el.removeAttribute('defer-hydration');
    await el.updateComplete;

    assertRefCalls([div]);

    el.remove();
    assertRefCalls([div, undefined]);

    document.body.appendChild(el);
    assertRefCalls([div, undefined, div]);

    // No further callbacks from the update scheduled by reconnecting.
    await el.updateComplete;
    assertRefCalls([div, undefined, div]);
  });

  test('ref is not called when element is removed before first update', async () => {
    // The element is never connected: removing 'defer-hydration' enables
    // updating while the element is detached.
    el.removeAttribute('defer-hydration');
    await el.updateComplete;

    assertRefCalls([]);

    // Connecting the hydrated element fires the ref callback once.
    document.body.appendChild(container);
    assertRefCalls([div]);

    await el.updateComplete;
    assertRefCalls([div]);
  });
});
