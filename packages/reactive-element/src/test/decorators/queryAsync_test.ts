/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {queryAsync} from '@lit/reactive-element/decorators/query-async.js';
import {
  canTestReactiveElement,
  generateElementName,
  RenderingElement,
  html,
} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

(canTestReactiveElement ? suite : suite.skip)('@queryAsync', () => {
  let container: HTMLElement;
  let el: C;

  class C extends RenderingElement {
    @queryAsync('#blah') blah!: Promise<HTMLDivElement>;
    @queryAsync('span') nope!: Promise<HTMLSpanElement | null>;

    static override properties = {foo: {}};

    declare foo: boolean;

    constructor() {
      super();
      // Avoiding class fields for Babel compat.
      this.foo = false;
    }

    override render() {
      return html`
        <div>Not this one</div>
        ${this.foo
          ? html`<div id="blah" foo>This one</div>`
          : html`<div id="blah">This one</div>`}
      `;
    }
  }
  customElements.define(generateElementName(), C);

  setup(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    el = new C();
    container.appendChild(el);
  });

  teardown(() => {
    if (container !== undefined) {
      container.parentElement!.removeChild(container);
      (container as any) = undefined;
    }
  });

  test('returns an element when it exists after update', async () => {
    let div = await el.blah;
    assert.instanceOf(div, HTMLDivElement);
    assert.isFalse(div.hasAttribute('foo'));
    el.foo = true;
    div = await el.blah;
    assert.instanceOf(div, HTMLDivElement);
    assert.isTrue(div.hasAttribute('foo'));
  });

  test('returns null when no match', async () => {
    const span = await el.nope;
    assert.isNull(span);
  });
});
