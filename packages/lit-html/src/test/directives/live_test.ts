/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {live} from 'lit-html/directives/live.js';
import {html, noChange, nothing, render} from 'lit-html';
import {assert} from '@esm-bundle/chai';

class LiveTester extends HTMLElement {
  _x?: string;
  _setCount = 0;

  get x(): string | undefined {
    return this._x;
  }

  set x(v: string | undefined) {
    this._x = v;
    this._setCount++;
  }
}
customElements.define('live-tester', LiveTester);

suite('live directive', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  suite('properties', () => {
    test('live() is useful: property bindings ignore external changes', () => {
      const go = (x: string) =>
        render(html`<input .value="${x}" />}`, container);
      go('a');
      const el = container.firstElementChild as HTMLInputElement;
      el.value = 'b';
      go('a');
      assert.equal(el.value, 'b');
    });

    test('updates an externally set property', () => {
      const go = (x: string) =>
        render(html`<input .value="${live(x)}" />}`, container);
      go('a');
      const el = container.firstElementChild as HTMLInputElement;
      el.value = 'b';
      go('a');
      assert.equal(el.value, 'a');
    });

    test('does not set a non-changed property', () => {
      const go = (x: string) =>
        render(html`<live-tester .x="${live(x)}"></live-tester>}`, container);
      go('a');
      const el = container.firstElementChild as LiveTester;
      assert.equal(el.x, 'a');
      assert.equal(el._setCount, 1);
      go('a');
      assert.equal(el.x, 'a');
      assert.equal(el._setCount, 1);
    });

    test('noChange works', () => {
      const go = (x: unknown) =>
        render(html`<input .value="${live(x)}" />}`, container);
      go('a');
      const el = container.firstElementChild as HTMLInputElement;
      el.value = 'b';
      go(noChange);
      assert.equal(el.value, 'b');
    });
  });

  suite('attributes', () => {
    test('updates an externally set attribute', () => {
      const go = (x: string) =>
        render(html`<div class="${live(x)}">}</div>`, container);
      go('a');
      const el = container.firstElementChild as HTMLDivElement;
      el.className = 'b';
      go('a');
      assert.equal(el.getAttribute('class'), 'a');
    });

    test('does not set a non-changed attribute', async () => {
      let mutationCount = 0;
      const observer = new MutationObserver((records) => {
        mutationCount += records.length;
      });
      const go = (x: string) =>
        render(
          html`<div x="${live(x)}"></div>
            }`,
          container
        );
      go('a');
      const el = container.firstElementChild as LiveTester;
      assert.equal(el.getAttribute('x'), 'a');

      observer.observe(el, {attributes: true});

      go('b');
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(el.getAttribute('x'), 'b');
      assert.equal(mutationCount, 1);

      go('b');
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(el.getAttribute('x'), 'b');
      assert.equal(mutationCount, 1);
    });
  });

  test('removes an attribute with nothing', () => {
    const go = (x: any) =>
      render(html`<div class="${live(x)}">}</div>`, container);
    go('a');
    const el = container.firstElementChild as HTMLDivElement;
    el.className = 'b';
    go(nothing);
    assert.isFalse(el.hasAttribute('class'));
  });

  test('noChange works', () => {
    const go = (x: any) =>
      render(html`<div class="${live(x)}">}</div>`, container);
    go('a');
    const el = container.firstElementChild as HTMLDivElement;
    el.className = 'b';
    go(noChange);
    assert.equal(el.getAttribute('class'), 'b');
  });

  test('does not set a non-changed attribute with a non-string value', async () => {
    let mutationCount = 0;
    const observer = new MutationObserver((records) => {
      mutationCount += records.length;
    });
    const go = (x: number) =>
      render(
        html`<div x="${live(x)}"></div>
          }`,
        container
      );
    go(1);
    const el = container.firstElementChild as LiveTester;
    assert.equal(el.getAttribute('x'), '1');

    observer.observe(el, {attributes: true});

    go(2);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(el.getAttribute('x'), '2');
    assert.equal(mutationCount, 1);

    go(2);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(el.getAttribute('x'), '2');
    assert.equal(mutationCount, 1);
  });

  suite('boolean attributes', () => {
    test('updates an externally set boolean attribute', () => {
      const go = (x: boolean) =>
        render(
          html`<div ?hidden="${live(x)}"></div>
            }`,
          container
        );

      go(true);
      const el = container.firstElementChild as HTMLDivElement;
      assert.equal(el.getAttribute('hidden'), '');

      go(true);
      assert.equal(el.getAttribute('hidden'), '');

      el.removeAttribute('hidden');
      assert.equal(el.getAttribute('hidden'), null);

      go(true);
      assert.equal(el.getAttribute('hidden'), '');
    });

    test('does not set a non-changed boolean attribute', async () => {
      let mutationCount = 0;
      const observer = new MutationObserver((records) => {
        mutationCount += records.length;
      });
      const go = (x: boolean) =>
        render(
          html`<div ?hidden="${live(x)}"></div>
            }`,
          container
        );

      go(true);
      const el = container.firstElementChild as LiveTester;
      assert.equal(el.getAttribute('hidden'), '');

      observer.observe(el, {attributes: true});

      go(false);
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(el.getAttribute('hidden'), null);
      assert.equal(mutationCount, 1);

      go(false);
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(el.getAttribute('hidden'), null);
      assert.equal(mutationCount, 1);
    });
  });
});
