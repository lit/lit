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
import {html, NodePart, render} from '../lit-html.js';
import {directive, Directive} from '../directive.js';
import {assert} from '@esm-bundle/chai';
import {stripExpressionComments} from './test-utils/strip-markers.js';
import {insertPart, removePart} from '../directive-helpers.js';

suite('lit-html', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('insertPart', () => {
    class TestDirective extends Directive {
      render(v: unknown) {
        return v;
      }

      update(part: NodePart, [v]: Parameters<this['render']>) {
        // Create two parts and remove the first, then the second to make sure
        // that removing the first doesn't move the second's markers. This
        // fails if the parts accidentally share a marker.
        const childPart2 = insertPart(part, undefined);
        const childPart1 = insertPart(part, undefined, childPart2);
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
