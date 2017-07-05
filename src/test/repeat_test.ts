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

/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />

import {html, InstancePart} from '../lit-html.js';
import {repeat} from '../repeat.js';

const assert = chai.assert;

suite('repeat', () => {

  let container: HTMLElement;
  let startNode: Node;
  let endNode: Node;
  let part: InstancePart;

  setup(() => {
    container = document.createElement('div');
    startNode = new Text();
    endNode = new Text();
    container.appendChild(startNode);
    container.appendChild(endNode);
    part = new InstancePart(startNode, endNode);
  });

  test('accepts an InstancePart to its thunk', () => {
    const r = repeat([1, 2, 3], (i: number) => html`
          <li>item: ${i}</li>`);
    r(part);
    assert.equal(container.innerHTML, `
          <li>item: 1</li>
          <li>item: 2</li>
          <li>item: 3</li>`);
  });

  test('updates with key function are stable', () => {
    let items = [1, 2, 3];
    const t = () => repeat(items, (i) => i, (i: number) => html`
          <li>item: ${i}</li>`);
    t()(part);
    assert.equal(container.innerHTML, `
          <li>item: 1</li>
          <li>item: 2</li>
          <li>item: 3</li>`);
    const originalLIs = Array.from(container.querySelectorAll('li'));

    items = [3, 2, 1];
    t()(part);
    assert.equal(container.innerHTML, `
          <li>item: 3</li>
          <li>item: 2</li>
          <li>item: 1</li>`);
    const newLIs = Array.from(container.querySelectorAll('li'));
    assert.strictEqual(originalLIs[0], newLIs[2]);
    assert.strictEqual(originalLIs[1], newLIs[1]);
    assert.strictEqual(originalLIs[2], newLIs[0]);
  });


  test.skip('renders an array of values', () => {
    const container = document.createElement('div');
    html`
      <ul>${
        repeat([1, 2, 3], (i: number) => html`
          <li>item: ${i}</li>`)}
      </ul>`.renderTo(container);
    assert.equal(container.innerHTML, `
      <ul>
          <li>item: 1</li>
          <li>item: 2</li>
          <li>item: 3</li>
      </ul>`);
  });

  test.skip('updates render stable output for keys', () => {
    const container = document.createElement('div');
    let items = [1, 2, 3];
    const t = () => html`
      <ul>${
        repeat(items, (i) => i, (i: number) => html`
          <li>item: ${i}</li>`)}
      </ul>`;
    t().renderTo(container);
    assert.equal(container.innerHTML, `
      <ul>
          <li>item: 1</li>
          <li>item: 2</li>
          <li>item: 3</li>
      </ul>`);

    const originalLIs = Array.from(container.querySelectorAll('li'));

    items = [3, 2, 1];
    t().renderTo(container);
    assert.equal(container.innerHTML, `
      <ul>
          <li>item: 3</li>
          <li>item: 2</li>
          <li>item: 1</li>
      </ul>`);
    
    const newLIs = Array.from(container.querySelectorAll('li'));
    assert.strictEqual(originalLIs[0], newLIs[2]);
    assert.strictEqual(originalLIs[1], newLIs[1]);
    assert.strictEqual(originalLIs[2], newLIs[0]);
  });

});
