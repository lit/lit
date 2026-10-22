/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {keyed} from 'lit-html/directives/keyed.js';
import {ref} from 'lit-html/directives/ref.js';
import {html, render} from 'lit-html';
import {directive, AsyncDirective} from 'lit-html/async-directive.js';
import {stripExpressionMarkers} from '@lit-labs/testing';
import {assert} from 'chai';

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

  test('disconnects the previous value when the key changes', () => {
    const log: string[] = [];
    const logged = directive(
      class extends AsyncDirective {
        id: string | undefined;
        render(id: string) {
          this.id = id;
          log.push(`render-${id}`);
          return id;
        }
        override disconnected() {
          log.push(`disconnected-${this.id}`);
        }
      }
    );
    const go = (k: number) =>
      render(keyed(k, html`<div>${logged(`${k}`)}</div>`), container);

    go(1);
    assert.deepEqual(log, ['render-1']);

    // Rerendering with same key should keep the value connected
    go(1);
    assert.deepEqual(log, ['render-1', 'render-1']);

    // Rerendering with a different key should disconnect the previous value
    // before rendering the new one
    go(2);
    assert.deepEqual(log, [
      'render-1',
      'render-1',
      'disconnected-1',
      'render-2',
    ]);
  });

  test('releases a ref in the previous value when the key changes', () => {
    const log: string[] = [];
    // One callback per key. With a single shared callback, ref() would call
    // it with undefined by itself when the new element renders, which would
    // hide whether the previous value was disconnected.
    const callbacks = new Map<number, (el: Element | undefined) => void>();
    const callbackFor = (k: number) => {
      if (!callbacks.has(k)) {
        callbacks.set(k, (el) => log.push(`${k}:${el?.tagName}`));
      }
      return callbacks.get(k)!;
    };
    const go = (k: number) =>
      render(keyed(k, html`<div ${ref(callbackFor(k))}></div>`), container);

    go(1);
    assert.deepEqual(log, ['1:DIV']);

    // Rerendering with a different key should clear the ref of the previous
    // div before setting the ref of the new one
    go(2);
    assert.deepEqual(log, ['1:DIV', '1:undefined', '2:DIV']);
  });
});
