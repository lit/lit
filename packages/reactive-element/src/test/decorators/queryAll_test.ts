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

import {queryAll} from '../../decorators/queryAll.js';
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

    render() {
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
});
