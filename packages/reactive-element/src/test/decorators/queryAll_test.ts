/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {queryAll} from '@lit/reactive-element/decorators/query-all.js';
import {
  canTestReactiveElement,
  generateElementName,
  RenderingElement,
  html,
} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

(canTestReactiveElement ? suite : suite.skip)('@queryAll', () => {
  let container: HTMLElement;
  let el: C;

  class C extends RenderingElement {
    @queryAll('div') divs!: NodeList;

    @queryAll('span') spans!: NodeList;

    override render() {
      return html`
        <div>Not this one</div>
        <div id="blah">This one</div>
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

  test('returns elements when they exists', () => {
    assert.lengthOf(el.divs, 2);
    assert.deepEqual(
      Array.from(el.divs),
      Array.from(el.renderRoot.querySelectorAll('div'))
    );
  });

  test('returns empty NodeList when no match', () => {
    assert.lengthOf(el.spans, 0);
    assert.deepEqual(
      Array.from(el.spans),
      Array.from(el.renderRoot.querySelectorAll('span'))
    );
  });

  test('returns empty array when no match and accessed before first update', () => {
    const notYetUpdatedEl = new C();
    assert.lengthOf(notYetUpdatedEl.spans, 0);
    assert.deepEqual(Array.from(notYetUpdatedEl.spans), []);
  });
});
