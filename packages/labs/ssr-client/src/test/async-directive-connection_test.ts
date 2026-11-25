/**
 * @license
 * Copyright The Lit Project Contributors.
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import {assert} from 'chai';
import {LitElement, html} from 'lit';
import {ref} from 'lit/directives/ref.js';

class RefElement extends LitElement {
  calls: Array<Element | undefined> = [];

  override render() {
    return html`<div ${ref((el) => this.calls.push(el))}>Foo</div>`;
  }
}
customElements.define('ref-element', RefElement);

// Output of `@lit-labs/ssr` for RefElement's template.
const SSR =
  '<!--lit-part rxWFm6aagr0=--><!--lit-node 0--><div >Foo</div><!--/lit-part-->';

suite('ssr client async directive connection state', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    container.remove();
  });

  test('ref follows host disconnect and reconnect after hydration', async () => {
    container.setHTMLUnsafe(`
      <ref-element defer-hydration>
        <template shadowroot="open" shadowrootmode="open">
          ${SSR}
        </template>
      </ref-element>`);
    const el = container.querySelector('ref-element') as RefElement;
    el.removeAttribute('defer-hydration');
    await el.updateComplete;
    assert.equal(el.calls.length, 1);
    assert.strictEqual(el.calls[0], el.shadowRoot!.querySelector('div'));

    container.removeChild(el);
    assert.deepEqual(
      el.calls.map((c) => c === undefined),
      [false, true]
    );

    container.appendChild(el);
    assert.deepEqual(
      el.calls.map((c) => c === undefined),
      [false, true, false]
    );
  });

  test('ref is not called when removed before the first update', async () => {
    container.setHTMLUnsafe(`
      <ref-element defer-hydration>
        <template shadowroot="open" shadowrootmode="open">
          ${SSR}
        </template>
      </ref-element>`);
    const el = container.querySelector('ref-element') as RefElement;
    el.removeAttribute('defer-hydration');
    // Detach before the microtask that performs the first update.
    container.removeChild(el);
    await el.updateComplete;
    assert.equal(el.calls.length, 0);
  });
});
