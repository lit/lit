/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {keyed} from 'lit-html/directives/keyed.js';
import {guard} from 'lit-html/directives/guard.js';
import {ref} from 'lit-html/directives/ref.js';
import {until} from 'lit-html/directives/until.js';
import {html, nothing, render} from 'lit-html';
import {directive, AsyncDirective} from 'lit-html/async-directive.js';
import {stripExpressionMarkers} from '@lit-labs/testing';
import {assert} from 'chai';

suite('keyed directive', () => {
  let container: HTMLDivElement;

  // An async directive that logs its renders and disconnections, to observe
  // what keyed() does with the value it replaces.
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

  setup(() => {
    container = document.createElement('div');
    log.length = 0;
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

  test('disconnects the previous value when the key changes from nothing', () => {
    const go = (k: unknown) =>
      render(keyed(k, html`<div>${logged(`${String(k)}`)}</div>`), container);

    go(nothing);
    assert.deepEqual(log, ['render-Symbol(lit-nothing)']);

    go(1);
    assert.deepEqual(log, [
      'render-Symbol(lit-nothing)',
      'disconnected-Symbol(lit-nothing)',
      'render-1',
    ]);
  });

  test('disconnects a value that keyed() replaces on its first render', () => {
    render(html`<div>${logged('plain')}</div>`, container);
    assert.deepEqual(log, ['render-plain']);

    render(keyed(1, html`<div>${logged('keyed')}</div>`), container);
    assert.deepEqual(log, [
      'render-plain',
      'disconnected-plain',
      'render-keyed',
    ]);
  });

  test('releases a ref in the previous value when the key changes', () => {
    const refLog: string[] = [];
    // One callback per key. With a single shared callback, ref() would call
    // it with undefined by itself when the new element renders, which would
    // hide whether the previous value was disconnected.
    const callbacks = new Map<number, (el: Element | undefined) => void>();
    const callbackFor = (k: number) => {
      if (!callbacks.has(k)) {
        callbacks.set(k, (el) => refLog.push(`${k}:${el?.tagName}`));
      }
      return callbacks.get(k)!;
    };
    const go = (k: number) =>
      render(keyed(k, html`<div ${ref(callbackFor(k))}></div>`), container);

    go(1);
    assert.deepEqual(refLog, ['1:DIV']);

    // Rerendering with a different key should clear the ref of the previous
    // div before setting the ref of the new one
    go(2);
    assert.deepEqual(refLog, ['1:DIV', '1:undefined', '2:DIV']);
  });

  test('renders a nested guard() again when the key changes', () => {
    let calls = 0;
    const go = (k: number) =>
      render(
        keyed(
          k,
          guard([42], () => {
            calls++;
            return 'value';
          })
        ),
        container
      );

    go(1);
    assert.equal(stripExpressionMarkers(container.innerHTML), 'value');
    assert.equal(calls, 1);

    // Rerendering with same key should not re-run the guarded function
    go(1);
    assert.equal(calls, 1);

    // Rerendering with a different key should render the value from scratch,
    // even though the guarded inputs did not change
    go(2);
    assert.equal(stripExpressionMarkers(container.innerHTML), 'value');
    assert.equal(calls, 2);
  });

  test('renders a nested until() again when the key changes', async () => {
    const promise = Promise.resolve('done');
    const go = (k: number) => render(keyed(k, until(promise)), container);

    go(1);
    await promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), 'done');
    const text = container.lastChild;
    assert.equal(text?.nodeType, Node.TEXT_NODE);

    // Rerendering with a different key should render the already resolved
    // promise again, in new DOM
    go(2);
    await promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), 'done');
    assert.notStrictEqual(container.lastChild, text);
  });

  test('keeps working in attribute and element parts', () => {
    let refEl: Element | undefined;
    const go = (k: number) =>
      render(
        html`<div title=${keyed(k, 'title')} ${keyed(
          k,
          ref((el) => (refEl = el))
        )}></div>`,
        container
      );

    go(1);
    const div = container.firstElementChild!;
    assert.equal(div.getAttribute('title'), 'title');
    assert.strictEqual(refEl, div);

    go(2);
    assert.strictEqual(container.firstElementChild, div);
    assert.equal(div.getAttribute('title'), 'title');
    assert.strictEqual(refEl, div);
  });
});
