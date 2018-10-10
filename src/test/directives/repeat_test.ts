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

import {async} from '../../directives/async.js';
import {guard} from '../../directives/guard.js';
import {repeat} from '../../directives/repeat.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

function assertItemIdentity(
    oldChildren: HTMLElement[],
    newChildren: HTMLElement[],
    newOrder: number[]) {
  newOrder.forEach((o, n) => {
    if (o >= 0 && o < oldChildren.length) {
      assert.strictEqual(oldChildren[o], newChildren[n]);
    }
  });
}

suite('repeat', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  suite('keyed', () => {
    test('renders a list', () => {
      const r = html`${repeat([1, 2, 3], (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(r, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 1</li>
            <li>item: 2</li>
            <li>item: 3</li>`);
    });

    test('renders a list twice', () => {
      const t = (items: any[]) =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t([0, 1, 2]), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>`);
      const children1 = Array.from(container.querySelectorAll('li'));

      render(t([0, 1, 2]), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, [0, 1, 2]);
    });

    test('shuffles are stable', () => {
      let items = [0, 1, 2];
      const t = () => html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>`);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [2, 1, 0];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 2</li>
            <li>item: 1</li>
            <li>item: 0</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, items);
    });

    test('shuffles a list with additions', () => {
      let items = [0, 1, 2, 3, 4];
      const t = () => html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>
            <li>item: 3</li>
            <li>item: 4</li>`);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [2, 0, 3, 5, 1, 4];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 2</li>
            <li>item: 0</li>
            <li>item: 3</li>
            <li>item: 5</li>
            <li>item: 1</li>
            <li>item: 4</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, items);
    });

    test('swaps are stable', () => {
      const t = (items: number[]) =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      let items = [0, 1, 2, 3, 4];
      render(t(items), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>
            <li>item: 3</li>
            <li>item: 4</li>`);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [0, 4, 2, 3, 1];
      render(t(items), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 4</li>
            <li>item: 2</li>
            <li>item: 3</li>
            <li>item: 1</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, items);
    });

    test('can re-render after swap', () => {
      const t = (items: number[]) =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      let items = [0, 1, 2];
      render(t(items), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>`);

      items = [2, 1, 0];
      render(t(items), container);

      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 2</li>
            <li>item: 1</li>
            <li>item: 0</li>`);

      render(t(items), container);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, items);
    });

    test('can insert an item at the beginning', () => {
      let items = [0, 1, 2];
      const t = () => html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(t(), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [-1, 0, 1, 2];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: -1</li>
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, items);
    });

    test('can insert an item at the end', () => {
      let items = [0, 1, 2];
      const t = () => html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [0, 1, 2, 3];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>
            <li>item: 3</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, items);
    });

    test('can replace with an empty list', () => {
      let items = [0, 1, 2];
      const t = () => html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      items = [];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), ``);
    });

    test('can remove the first item', () => {
      let items = [0, 1, 2];
      const t = () => html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>`);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [1, 2];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 1</li>
            <li>item: 2</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, items);
    });

    test('can remove the last item', () => {
      let items = [0, 1, 2];
      const t = () => html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [0, 1];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, items);
    });

    test('can remove a middle item', () => {
      let items = [0, 1, 2];
      const t = () => html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [0, 2];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 2</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, items);
    });

    test('can remove multiple middle items', () => {
      let items = [0, 1, 2, 3, 4, 5, 6];
      const t = () => html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [0, 3, 6];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 3</li>
            <li>item: 6</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, items);
    });

    test('can move multiple middle items', () => {
      let items = [0, 1, 2, 3, 4, 5, 6];
      const t = () => html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [0, 4, 5, 3, 2, 1, 6];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 4</li>
            <li>item: 5</li>
            <li>item: 3</li>
            <li>item: 2</li>
            <li>item: 1</li>
            <li>item: 6</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      assertItemIdentity(children1, children2, items);
    });

    test('can add multiple middle items', () => {
      let items = [0, 1, 2, 3, 4];
      const t = () => html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [0, 5, 1, 2, 3, 6, 4];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 5</li>
            <li>item: 1</li>
            <li>item: 2</li>
            <li>item: 3</li>
            <li>item: 6</li>
            <li>item: 4</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));
      assertItemIdentity(children1, children2, items);
    });
  });

  suite('un-keyed', () => {
    test('renders a list', () => {
      const r = html`${repeat([0, 1, 2], (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(r, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>`);
    });

    test('shuffles a list', () => {
      let items = [0, 1, 2];
      const t = () => html`${repeat(items, (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>`);

      items = [2, 1, 0];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 2</li>
            <li>item: 1</li>
            <li>item: 0</li>`);
    });

    test('can replace with an empty list', () => {
      let items = [0, 1, 2];
      const t = () => html`${repeat(items, (i: number) => html`
            <li>item: ${i}</li>`)}`;
      render(t(), container);

      items = [];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), ``);
    });

    test('re-renders a list', () => {
      const items = [0, 1, 2, 3, 4];
      const t = () => html`${repeat(items, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t(), container);
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>
            <li>item: 3</li>
            <li>item: 4</li>`);
    });

    test('render objects as items with mutable update', () => {
      const items = [{text: '0'}, {text: '1'}, {text: '2'}];
      const t = () => html`${repeat(items, (i) => html`
            <li>item: ${i.text}</li>`)}`;
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>`);
      const children1 = Array.from(container.querySelectorAll('li'));

      items[1].text += '*';
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1*</li>
            <li>item: 2</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));
      assertItemIdentity(children1, children2, [0, 1, 2]);
    });

    test('render objects as items with immutable update', () => {
      let items = [{text: '0'}, {text: '1'}, {text: '2'}];
      const t = () => html`${repeat(items, (i) => html`
            <li>item: ${i.text}</li>`)}`;
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>`);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [items[0], {text: items[1].text + '*'}, items[2]];
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1*</li>
            <li>item: 2</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));
      assertItemIdentity(children1, children2, [0, 1, 2]);
    });
  });

  suite('rendering other values', () => {
    test('render promises as values', async () => {
      const items = [0, 1, 2];
      const t = () =>
          html`${repeat(items, (i: number) => async(Promise.resolve(html`
            <li>promised: ${i}</li>`)))}`;
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '');
      await Promise.resolve();
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>promised: 0</li>
            <li>promised: 1</li>
            <li>promised: 2</li>`);
    });

    test('render nested directives as values', async () => {
      const items = [0, 1, 2];
      const t = () => html`${
          repeat(
              items,
              (i: number) => async(
                  Promise.resolve(guard(items, () => html`
            <li>guarded: ${i}</li>`)),
                  html`
            <li>wait: ${i}</li>`))}`;
      render(t(), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>wait: 0</li>
            <li>wait: 1</li>
            <li>wait: 2</li>`);
      await Promise.resolve();
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>guarded: 0</li>
            <li>guarded: 1</li>
            <li>guarded: 2</li>`);
    });
  });

  suite('undefined behavior', () => {
    // Note these tests are only meant to capture the current implementation's
    // behavior, not to serve as a guarantee for repeat's behavior.
    // Providing duplicate keys is officially not supported.  If these tests
    // break due to implementation changes, feel free to update the expected
    // results.

    test('initial render of contiguous duplicate keys', () => {
      const t = (items: number[]) =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t([0, 1, 2, 2, 3, 4]), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>
            <li>item: 2</li>
            <li>item: 3</li>
            <li>item: 4</li>`);
    });

    test('update contiguous duplicate keys (no order change)', () => {
      const t = (items: number[]) =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      let items = [0, 1, 2, 2, 3, 4];
      render(t(items), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [0, 1, 2, 2, 3, 4];
      render(t(items), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 2</li>
            <li>item: 2</li>
            <li>item: 3</li>
            <li>item: 4</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      //   Parts for these dup'ed keys are maintained v  v
      assertItemIdentity(children1, children2, [0, 1, 2, 3, 4, 5]);
    });

    test('initial render of duplicate keys with skip', () => {
      const t = (items: number[]) =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t([0, 1, 42, 2, 42, 3, 4]), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 0</li>
            <li>item: 1</li>
            <li>item: 42</li>
            <li>item: 2</li>
            <li>item: 42</li>
            <li>item: 3</li>
            <li>item: 4</li>`);
    });

    test('update duplicate keys with skip', () => {
      const t = (items: number[]) =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      let items = [0, 1, 2, 3, 2, 4, 5];
      render(t(items), container);
      const children1 = Array.from(container.querySelectorAll('li'));

      items = [1, 2, 0, 5, 2, 4, 3];
      render(t(items), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 1</li>
            <li>item: 2</li>
            <li>item: 0</li>
            <li>item: 5</li>
            <li>item: 2</li>
            <li>item: 4</li>
            <li>item: 3</li>`);
      const children2 = Array.from(container.querySelectorAll('li'));

      // Part for this duplicate key was re-created v
      assertItemIdentity(children1, children2, [1, -1, 0, 6, 2, 5, 3]);
    });
  });
});
