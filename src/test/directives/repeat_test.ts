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

import {repeat} from '../../directives/repeat.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

function assertItemIdentity(oldChildren:HTMLElement[], newChildren:HTMLElement[], newOrder:number[]) {
  newOrder.forEach((o,n) => {
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

    test('duplicate keys warns', () => {
      // Trap console.warn
      // TODO(kschaaf): Pull in sinon just for this?
      const origWarn = console.warn;
      let warnArgs: any[] = [];
      console.warn = (...args:any[]) => {
        warnArgs = args;
        origWarn.apply(console, args);
      }

      const t = (items: number[]) =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t([42, 42]), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 42</li>`);

      assert.match(warnArgs[0] || '', /duplicate key/i);

      // Restore console.warn
      console.warn = origWarn;
    });

    test('duplicate keys with skip warns', () => {
      // Trap console.warn
      // TODO(kschaaf): Pull in sinon just for this?
      const origWarn = console.warn;
      let warnArgs: any[] = [];
      console.warn = (...args:any[]) => {
        warnArgs = args;
        origWarn.apply(console, args);
      }

      const t = (items: number[]) =>
          html`${repeat(items, (i) => i, (i: number) => html`
            <li>item: ${i}</li>`)}`;

      render(t([42, 0, 42]), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), `
            <li>item: 42</li>
            <li>item: 0</li>`);

      assert.match(warnArgs[0] || '', /duplicate key/i);

      // Restore console.warn
      console.warn = origWarn;
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
  });
});
