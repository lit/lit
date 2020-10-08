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

import {html, LitElement} from '../../lit-element.js';
import {query} from '../../lib/decorators/query.js';
import {canTestLitElement, generateElementName} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

(canTestLitElement ? suite : suite.skip)('@query', () => {
  let container: HTMLElement;
  let el: C;

  class C extends LitElement {
    @query('#blah') div?: HTMLDivElement;
    @query('span', true) span?: HTMLSpanElement;

    static properties = {condition: {}};

    condition = false;

    render() {
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

  test('returns cached value', async () => {
    el.condition = true;
    await el.updateComplete;
    assert.equal(el.span, el.renderRoot.querySelector('span'));
    assert.instanceOf(el.span, HTMLSpanElement);
    el.condition = false;
    await el.updateComplete;
    assert.instanceOf(el.span, HTMLSpanElement);
    assert.notEqual(el.span, el.renderRoot.querySelector('span'));
  });
});
