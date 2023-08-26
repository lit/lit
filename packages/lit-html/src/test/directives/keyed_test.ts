/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {keyed} from 'lit-html/directives/keyed.js';
import {html, render} from 'lit-html';
import {stripExpressionMarkers} from '@lit-labs/testing';
import {assert} from '@esm-bundle/chai';

suite('keyed directive', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('re-renders when the key changes', () => {
    const go = (k: any) =>
      render(keyed(k, html`<div .foo=${k}></div>`), container);

    // Initial render
    go(1);
    const div = container.firstElementChild;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    assert.equal((div as any).foo, 1);

    // Rerendering with same key should reuse the DOM
    go(1);
    const div2 = container.firstElementChild;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    assert.equal((div2 as any).foo, 1);
    assert.strictEqual(div, div2);

    // Rerendering with a different key should not reuse the DOM
    go(2);
    const div3 = container.firstElementChild;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    assert.equal((div3 as any).foo, 2);
    assert.notStrictEqual(div, div3);
  });
});
