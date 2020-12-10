/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
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
import {
  Directive,
  directive,
  html,
  noChange,
  NodePart,
  render,
} from '../lit-html.js';
import {assert} from '@esm-bundle/chai';
import {stripExpressionComments} from './test-utils/strip-markers.js';
import {
  createAndInsertPart,
  detachNodePart,
  getPartValue,
  removePart,
  restoreNodePart,
} from '../directive-helpers.js';

suite('lit-html', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('detach / restore', () => {
    // Make sure detach()/restore() are sufficient for array item swaps.

    // This test directive swaps the 2nd and 3rd array elements on the second
    // render. This exercizes using detach() and restore() to move part DOM
    // and values between parts.
    class SwapDirective extends Directive {
      render(items: Array<number>) {
        return items.map((i) => html`<li>${i}</li>`);
      }
      update(part: NodePart, [items]: Parameters<this['render']>) {
        if (getPartValue(part) !== undefined) {
          // this is the second render, let's swap some parts
          const parts = getPartValue(part) as Array<NodePart>;
          const state1 = detachNodePart(parts[1]);
          const state2 = detachNodePart(parts[2]);
          restoreNodePart(parts[1], state2);
          restoreNodePart(parts[2], state1);
          return noChange;
        } else {
          return this.render(items);
        }
      }
    }
    const swap = directive(SwapDirective);

    const go = (items: any) => render(html`<ul>${swap(items)}</ul>`, container);

    // Initial render with 4 template results:
    go([1, 2, 3, 4]);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<ul><li>1</li><li>2</li><li>3</li><li>4</li></ul>'
    );
    const liElementsBefore = container.querySelectorAll('li');

    go([1, 2, 3, 4]);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<ul><li>1</li><li>3</li><li>2</li><li>4</li></ul>'
    );
    const liElementsAfter = container.querySelectorAll('li');

    assert.strictEqual(liElementsBefore[0], liElementsAfter[0]);
    assert.strictEqual(liElementsBefore[1], liElementsAfter[2]);
    assert.strictEqual(liElementsBefore[2], liElementsAfter[1]);
    assert.strictEqual(liElementsBefore[3], liElementsAfter[3]);
  });

  test('createAndInsertPart', () => {
    class TestDirective extends Directive {
      render(v: unknown) {
        return v;
      }

      update(part: NodePart, [v]: Parameters<this['render']>) {
        // Create two parts and remove the first, then the second to make sure
        // that removing the first doesn't move the second's markers. This
        // fails if the parts accidentally share a marker.
        const childPart2 = createAndInsertPart(part);
        const childPart1 = createAndInsertPart(part, childPart2);
        removePart(childPart1);
        removePart(childPart2);
        return v;
      }
    }
    const testDirective = directive(TestDirective);

    const go = (v: unknown) =>
      render(html`<div>${testDirective(v)}</div>`, container);

    go('A');
    assert.equal(stripExpressionComments(container.innerHTML), '<div>A</div>');
  });
});
