/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, render} from '../lit-html.js';
import {attr} from '../attr.js';
import {assert} from '@esm-bundle/chai';
import {stripExpressionComments} from './test-utils/strip-markers.js';

suite('attr', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('simple', () => {
    const attrs = attr`x=${'a'} .foo=${'bar'}`;
    render(html`<div ${attrs}></div>`, container);

    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div x="a"></div>'
    );
    const el = container.firstElementChild!;
    assert.equal((el as any).foo, 'bar');
  });

  // TODO: First we need a way to represent element bindings in spread
  test.skip('composition', () => {
    const attrs1 = attr`x=${'a'} .foo=${'bar'}`;
    const attrs2 = attr`${attrs1} y=${'b'}`;
    render(html`<div ${attrs2}></div>`, container);

    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div x="a" y="b"></div>'
    );
    const el = container.firstElementChild!;
    assert.equal((el as any).foo, 'bar');
  });
});
