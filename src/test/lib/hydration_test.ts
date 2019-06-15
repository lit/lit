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

import {html, hydrate, render} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

suite('hydration', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('hydrates a text binding', () => {
    const hello = (name: string) => html`<h1>Hello ${name}</h1>`;

    // 1) Render to a separate container to simulate SSR
    const prerenderContainer = document.createElement('div');
    render(hello('Pre-rendering'), prerenderContainer);
    console.log('prerenderContainer', prerenderContainer.innerHTML);
    assert.equal(
        stripExpressionMarkers(prerenderContainer.innerHTML),
        '<h1>Hello Pre-rendering</h1>');

    // 2) Clone contents into a new container to dissacociate from any state
    container.innerHTML = prerenderContainer.innerHTML;
    console.log('container', container.innerHTML);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<h1>Hello Pre-rendering</h1>');

    // 3) Remember some nodes so we can check that they're not overwritten
    const prerenderHeader = container.querySelector('h1')!;
    const prerenderStaticText = prerenderHeader.childNodes[2];
    assert.equal(prerenderStaticText.nodeType, Node.TEXT_NODE);

    // 4) Re-render in hydration mode
    hydrate(hello('Hydration'), container);
    console.log('container postrender', container.innerHTML);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<h1>Hello Hydration</h1>');

    // 5) Get new references to the nodes
    const postrenderHeader = container.querySelector('h1')!;
    const postrenderStaticText = postrenderHeader.childNodes[2];

    // 6) Check that they're the same
    assert.strictEqual(prerenderHeader, postrenderHeader);
    assert.strictEqual(prerenderStaticText, postrenderStaticText);
  });
});
