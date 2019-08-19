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
import {repeat} from '../../directives/repeat.js';

const assert = chai.assert;

suite('hydration', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('hydrates a text binding with a new post-render value', () => {
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

  test('hydrates nested templates', () => {
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

  test('hydrates repeat directive with strings', () => {
    const words = (words: string[]) => html`${repeat(words, (word, i) => `(${i} ${word})`)}`;

    prerender(words(['foo', 'bar', 'qux']), container);

    hydrate(words(['A', 'B', 'C']), container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '(0 A)(1 B)(2 C)');
  });

  test('hydrates repeat directive with TemplateResults', () => {
    const words = (words: string[]) => html`${repeat(words, (word, i) => html`<p>${i}) ${word}</p>`)}`;

    prerender(words(['foo', 'bar', 'qux']), container);

    hydrate(words(['A', 'B', 'C']), container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<p>0) A</p><p>1) B</p><p>2) C</p>');
  });

  test('hydrates repeat directive without tearing down pre-rendered DOM', () => {
    const words = (words: string[]) => html`${repeat(words, (word, i) => html`<p>${i}) ${word}</p>`)}`;

    prerender(words(['foo', 'bar', 'qux']), container);
    const p0 = container.children[0];
    const p1 = container.children[1];
    const p2 = container.children[2];

    hydrate(words(['foo', 'bar', 'qux']), container, { dataChanged: false });
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<p>0) foo</p><p>1) bar</p><p>2) qux</p>');
    assert.strictEqual(container.children[0], p0);
    assert.strictEqual(container.children[1], p1);
    assert.strictEqual(container.children[2], p2);
  });
});

const prerender = (r: TemplateResult, container: HTMLElement) => {
  const prerenderContainer = document.createElement('div');
  render(r, prerenderContainer);
  container.innerHTML = prerenderContainer.innerHTML;
};
