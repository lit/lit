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

import {TemplateResult} from '../../lib/shady-render.js';
import {html, hydrate, render} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

suite('hydration', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test.skip('hydrates a text binding with a new post-render value', () => {
    const hello = (name: string) => html`<h1>Hello ${name}</h1>`;

    prerender(hello('Pre-rendering'), container);
    console.log('container.innerHTML', container.innerHTML);

    // Remember some nodes so we can check that they're not overwritten
    const prerenderedHeader = container.querySelector('h1')!;
    const prerenderedDynamicText = prerenderedHeader.childNodes[2];
    assert.equal(prerenderedDynamicText.nodeType, Node.TEXT_NODE);

    hydrate(hello('Hydration'), container);
    console.log('container postrender', container.innerHTML);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<h1>Hello Hydration</h1>');

    // Get new references to the nodes
    const postrenderHeader = container.querySelector('h1')!;
    const postrenderDynamicText = postrenderHeader.childNodes[2];

    // Check that they're the same
    assert.strictEqual(prerenderedHeader, postrenderHeader);
    assert.strictEqual(prerenderedDynamicText, postrenderDynamicText);
  });

  // We need to measure if it matters if we performs essentially no-op
  // textContent and attribute sets. To avoid we either need to infer previous
  // values from DOM (only posisble in some cases), or ship previous values to
  // the client. Seems like the browser should be able avoid work when setting
  // text/attribute to the same value just as well as we can.
  test.skip('hydrates a text binding with the same post-render value', () => {
    const hello = (name: string) => html`<h1>Hello ${name}</h1>`;

    prerender(hello('Pre-rendering'), container);
    const observer = new MutationObserver(() => {});
    observer.observe(container, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true
    });
    hydrate(hello('Pre-rendering'), container);
    assert.isEmpty(observer.takeRecords());
  });

  test.skip('hydrates nested templates', () => {
    const parent = (name: string, message: string) =>
        html`${hello(name)}<p>${message}</p>`;
    const hello = (name: string) => html`<h1>Hello ${name}</h1>`;

    prerender(parent('Pre-rendering', 'is cool'), container);

    // Remember some nodes so we can check that they're not overwritten
    const prerenderedHeader = container.querySelector('h1')!;
    const prerenderedDynamicText = prerenderedHeader.childNodes[2];
    assert.equal(prerenderedDynamicText.nodeType, Node.TEXT_NODE);

    hydrate(parent('Hydration', 'is cooler'), container);
    console.log('container postrender', container.innerHTML);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<h1>Hello Hydration</h1><p>is cooler</p>');

    // Get new references to the nodes
    const postrenderHeader = container.querySelector('h1')!;
    const postrenderDynamicText = postrenderHeader.childNodes[2];

    // Check that they're the same
    assert.strictEqual(prerenderedHeader, postrenderHeader);
    assert.strictEqual(prerenderedDynamicText, postrenderDynamicText);
  });

  test('hydrates an attribute binding with a new post-render value', () => {
    const hello = (cls: string, id: string) => html`<h1 class="${cls}">Hello <span id="${id}" class="${cls}">there</span></h1>`;

    prerender(hello('pre', 'rendering'), container);
    console.log('container.innerHTML', container.innerHTML);

    hydrate(hello('hy', 'dration'), container);
    console.log('container postrender', container.innerHTML);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<h1 class="hy">Hello <span id="dration" class="hy">there</span></h1>');
  });

  test('hydrates a multiple-binding attribute with a new post-render value', () => {
    const hello = (a: string, b: string) => html`<h1 class="${a}-${b}">Hello</h1>`;

    prerender(hello('pre', 'rendering'), container);
    console.log('container.innerHTML', container.innerHTML);

    hydrate(hello('hy', 'dration'), container);
    console.log('container postrender', container.innerHTML);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<h1 class="hy-dration">Hello</h1>');
  });
});

const prerender = (r: TemplateResult, container: HTMLElement) => {
  const prerenderContainer = document.createElement('div');
  render(r, prerenderContainer);
  container.innerHTML = prerenderContainer.innerHTML;
};
