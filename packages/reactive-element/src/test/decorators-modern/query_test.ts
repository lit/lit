/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {query} from '@lit/reactive-element/decorators/query.js';
import {
  canTestReactiveElement,
  generateElementName,
  RenderingElement,
  html,
} from '../test-helpers.js';
import {assert} from 'chai';

(canTestReactiveElement ? suite : suite.skip)('@query', () => {
  let container: HTMLElement;
  let el: C;

  class C extends RenderingElement {
    @query('#blah')
    accessor div!: HTMLDivElement;

    @query('#blah', true)
    accessor divCached!: HTMLDivElement;

    // The span is conditional, so this query could return null
    @query('span', true)
    accessor span!: HTMLSpanElement | null;

    static override properties = {condition: {}};

    declare condition: boolean;

    constructor() {
      super();
      // Avoiding class fields for Babel compat.
      this.condition = false;
    }

    override render() {
      return html`
        <div>Not this one</div>
        <div id="blah">This one</div>
        ${this.condition ? html`<span>Cached</span>` : ``}
      `;
    }
  }
  customElements.define(generateElementName(), C);

  setup(async () => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    el = new C();
    container.appendChild(el);
    await el.updateComplete;
  });

  teardown(() => {
    if (container !== undefined) {
      container.parentElement!.removeChild(container);
      (container as any) = undefined;
    }
  });

  test('returns an element when it exists', () => {
    const div = el.div;
    assert.instanceOf(div, HTMLDivElement);
    assert.equal(div!.innerText, 'This one');
  });

  test('returns null when no match', () => {
    assert.isNull(el.span);
  });

  test('returns null when no match and accessed before first update', () => {
    const notYetUpdatedEl = new C();
    assert.isNull(notYetUpdatedEl.span);
  });

  test('returns cached value', async () => {
    el.condition = true;
    await el.updateComplete;
    // trigger caching, so we can verify that multiple elements can be cached
    el.divCached;
    assert.equal(
      el.divCached,
      el.renderRoot.querySelector('#blah') as HTMLDivElement
    );
    assert.equal(el.span, el.renderRoot.querySelector('span'));
    assert.instanceOf(el.span, HTMLSpanElement);
    el.condition = false;
    await el.updateComplete;
    assert.instanceOf(el.span, HTMLSpanElement);
    assert.notEqual(el.span, el.renderRoot.querySelector('span'));
  });

  test('does not cache null values when accessed before first update', async () => {
    const notYetUpdatedEl = new C();
    assert.equal(notYetUpdatedEl.divCached, null);

    if (globalThis.litIssuedWarnings != null) {
      assert(
        [...globalThis.litIssuedWarnings].find((w) =>
          /@query'd field "divCached" with the 'cache' flag set for selector '#blah' has been accessed before the first update and returned null\. This is expected if the renderRoot tree has not been provided beforehand \(e\.g\. via Declarative Shadow DOM\)\. Therefore the value hasn't been cached\./.test(
            w ?? ''
          )
        ),
        `Expected warning to be issued. Warnings found: ${JSON.stringify(
          [...globalThis.litIssuedWarnings],
          null,
          2
        )}`
      );
    }

    container.appendChild(notYetUpdatedEl);
    await notYetUpdatedEl.updateComplete;
    assert.instanceOf(notYetUpdatedEl.divCached, HTMLDivElement);
  });
});
