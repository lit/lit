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
import {html, render} from '../../lit-html.js';
import {ref, createRef, RefOrCallback} from '../../directives/ref.js';
import {assert} from '@esm-bundle/chai';

suite('ref', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('sets a ref on a Ref object', () => {
    const divRef = createRef();
    render(html`<div ${ref(divRef)}></div>`, container);
    const div = container.firstElementChild;
    assert.equal(divRef.value, div);
  });

  test('calls a ref callback', () => {
    let divRef: Element | undefined;
    const divCallback = (el: Element | undefined) => (divRef = el);
    render(html`<div ${ref(divCallback)}></div>`, container);
    const div = container.firstElementChild;
    assert.equal(divRef, div);
  });

  test('sets a ref when Ref object changes', () => {
    const divRef1 = createRef();
    const divRef2 = createRef();

    const go = (r: RefOrCallback) =>
      render(html`<div ${ref(r)}></div>`, container);
    go(divRef1);
    const div1 = container.firstElementChild;
    assert.equal(divRef1.value, div1);

    go(divRef2);
    const div2 = container.firstElementChild;
    assert.equal(divRef1.value, undefined);
    assert.equal(divRef2.value, div2);
  });

  test('calls a ref callback when callback changes', () => {
    let divRef: Element | undefined;
    const divCallback1 = (el: Element | undefined) => (divRef = el);
    const divCallback2 = (el: Element | undefined) => (divRef = el);

    const go = (r: RefOrCallback) =>
      render(html`<div ${ref(r)}></div>`, container);

    go(divCallback1);
    const div1 = container.firstElementChild;
    assert.equal(divRef, div1);

    go(divCallback2);
    const div2 = container.firstElementChild;
    assert.equal(divRef, div2);
  });

  test('only sets a ref when element changes', () => {
    let queriedEl: Element | null;
    let callCount = 0;
    const elRef = createRef();

    const originalSet = elRef.set;
    elRef.set = function (v: Element | undefined) {
      originalSet.call(elRef, v);
      callCount++;
    };

    const go = (x: boolean) =>
      render(
        x ? html`<div ${ref(elRef)}></div>` : html`<span ${ref(elRef)}></span>`,
        container
      );

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.equal(elRef.value, queriedEl);
    assert.equal(callCount, 1);

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.equal(elRef.value, queriedEl);
    assert.equal(callCount, 1);

    go(false);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'SPAN');
    assert.equal(elRef.value, queriedEl);
    assert.equal(callCount, 2);
  });

  test('only calls a ref callback when element changes', () => {
    let queriedEl: Element | null;
    const calls: Array<string | undefined> = [];
    const elCallback = (e: Element | undefined) => {
      calls.push(e?.tagName);
    };
    const go = (x: boolean) =>
      render(
        x
          ? html`<div ${ref(elCallback)}></div>`
          : html`<span ${ref(elCallback)}></span>`,
        container
      );

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(calls, ['DIV']);

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(calls, ['DIV']);

    go(false);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'SPAN');
    assert.deepEqual(calls, ['DIV', undefined, 'SPAN']);

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(calls, ['DIV', undefined, 'SPAN', undefined, 'DIV']);
  });

  test('two refs', () => {
    const divRef1 = createRef();
    const divRef2 = createRef();
    render(html`<div ${ref(divRef1)} ${ref(divRef2)}></div>`, container);
    const div = container.firstElementChild;
    assert.equal(divRef1.value, div);
    assert.equal(divRef2.value, div);
  });

  test('two ref callbacks alternating', () => {
    let queriedEl: Element | null;
    const divCalls: Array<string | undefined> = [];
    const divCallback = (e: Element | undefined) => {
      divCalls.push(e?.tagName);
    };
    const spanCalls: Array<string | undefined> = [];
    const spanCallback = (e: Element | undefined) => {
      spanCalls.push(e?.tagName);
    };
    const go = (x: boolean) =>
      render(
        x
          ? html`<div ${ref(divCallback)}></div>`
          : html`<span ${ref(spanCallback)}></span>`,
        container
      );

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(divCalls, ['DIV']);
    assert.deepEqual(spanCalls, []);

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(divCalls, ['DIV']);
    assert.deepEqual(spanCalls, []);

    go(false);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'SPAN');
    assert.deepEqual(divCalls, ['DIV', undefined]);
    assert.deepEqual(spanCalls, ['SPAN']);

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(divCalls, ['DIV', undefined, 'DIV']);
    assert.deepEqual(spanCalls, ['SPAN', undefined]);
  });
});
