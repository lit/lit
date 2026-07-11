/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {queryAsyncAll} from '@lit/reactive-element/decorators/query-async-all.js';
import {
  canTestReactiveElement,
  generateElementName,
  RenderingElement,
  html,
} from '../test-helpers.js';
import {assert} from 'chai';

(canTestReactiveElement ? suite : suite.skip)('@queryAsyncAll', () => {
  let container: HTMLElement;
  let el: C;

  class ChildElement extends RenderingElement {
    override render() {
      return html`<div class="child"></div>`;
    }
  }
  customElements.define(generateElementName(), ChildElement);

  class C extends RenderingElement {
    @queryAsyncAll('div') accessor divs!: Promise<NodeListOf<HTMLDivElement>>;

    @queryAsyncAll('span') accessor spans!: Promise<
      NodeListOf<HTMLSpanElement>
    >;

    @queryAsyncAll('.foo') accessor foos!: Promise<NodeListOf<Element>>;

    override render() {
      return html`
        <div>Not this one</div>
        <div id="blah">This one</div>
        <div class="foo">Native</div>
        <child-element class="foo"></child-element>
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

  test('returns elements when they exist after update', async () => {
    const divs = await el.divs;
    assert.lengthOf(divs, 2);
    assert.deepEqual(
      Array.from(divs),
      Array.from(el.renderRoot.querySelectorAll('div'))
    );
  });

  test('returns empty NodeList when no match', async () => {
    const spans = await el.spans;
    assert.lengthOf(spans, 0);
    assert.deepEqual(
      Array.from(spans),
      Array.from(el.renderRoot.querySelectorAll('span'))
    );
  });

  test('works with class selectors for custom and native elements', async () => {
    const foos = await el.foos;
    assert.lengthOf(foos, 2);
    assert.deepEqual(
      Array.from(foos),
      Array.from(el.renderRoot.querySelectorAll('.foo'))
    );
  });
});
