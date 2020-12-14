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
import {html, ChildPart, render, svg} from '../lit-html.js';
import {directive, Directive} from '../directive.js';
import {assert} from '@esm-bundle/chai';
import {stripExpressionComments} from './test-utils/strip-markers.js';
import {
  insertPart,
  isDirectiveResult,
  isPrimitive,
  isTemplateResult,
  removePart,
  TemplateResultType,
} from '../directive-helpers.js';
import {classMap} from '../directives/class-map.js';
import {UnsafeHTML, unsafeHTML} from '../directives/unsafe-html.js';

suite('directive-helpers', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('isPrimitive', () => {
    assert.isTrue(isPrimitive(null));
    assert.isTrue(isPrimitive(undefined));
    assert.isTrue(isPrimitive(true));
    assert.isTrue(isPrimitive(1));
    assert.isTrue(isPrimitive('a'));
    assert.isTrue(isPrimitive(Symbol()));

    // Can't polyfill this syntax:
    // assert.isTrue(isPrimitive(1n));

    assert.isFalse(isPrimitive({}));
    assert.isFalse(isPrimitive(() => {}));
  });

  test('isTemplateResult', () => {
    assert.isTrue(isTemplateResult(html``));
    assert.isTrue(isTemplateResult(svg``));
    assert.isTrue(isTemplateResult(html``, TemplateResultType.HTML));
    assert.isTrue(isTemplateResult(svg``, TemplateResultType.SVG));

    assert.isFalse(isTemplateResult(null));
    assert.isFalse(isTemplateResult(undefined));
    assert.isFalse(isTemplateResult({}));
    assert.isFalse(isTemplateResult(html``, TemplateResultType.SVG));
    assert.isFalse(isTemplateResult(svg``, TemplateResultType.HTML));
    assert.isFalse(isTemplateResult(null, TemplateResultType.HTML));
    assert.isFalse(isTemplateResult(undefined, TemplateResultType.HTML));
    assert.isFalse(isTemplateResult({}, TemplateResultType.HTML));
  });

  test('isDirectiveResult', () => {
    assert.isTrue(isDirectiveResult(classMap({})));
    assert.isTrue(isDirectiveResult(unsafeHTML(''), UnsafeHTML));

    assert.isFalse(isDirectiveResult(null));
    assert.isFalse(isDirectiveResult(undefined));
    assert.isFalse(isDirectiveResult({}));
    assert.isFalse(isDirectiveResult(classMap({}), UnsafeHTML));
    assert.isFalse(isDirectiveResult(null, UnsafeHTML));
    assert.isFalse(isDirectiveResult(undefined, UnsafeHTML));
    assert.isFalse(isDirectiveResult({}, UnsafeHTML));
  });

  test('insertPart', () => {
    class TestDirective extends Directive {
      render(v: unknown) {
        return v;
      }

      update(part: ChildPart, [v]: Parameters<this['render']>) {
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
