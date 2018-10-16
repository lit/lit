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

import {async} from '../../directives/async.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {Deferred} from '../test-utils/deferred.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

suite('async', () => {
  let container: HTMLDivElement;
  let deferred: Deferred<string>;

  setup(() => {
    container = document.createElement('div');
    deferred = new Deferred<string>();
  });

  test('renders a Promise', async () => {
    let resolve: (v: any) => void;
    const promise = new Promise((res, _) => {
      resolve = res;
    });
    render(html`<div>${async(promise)}</div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    resolve!('foo');
    await promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders defaultContent immediately', async () => {
    const defaultContent = html`<span>loading...</span>`;
    render(
        html
        `<div>${async(deferred.promise, defaultContent)}</div>`,
        container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<div><span>loading...</span></div>');
        deferred.resolve('foo');
        await deferred.promise;
        await new Promise((r) => setTimeout(() => r()));
        assert.equal(
            stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders changing defaultContent', async () => {
    const t = (d: any) => html`<div>${async(deferred.promise, d)}</div>`;
    render(t('A'), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>A</div>');

    render(t('B'), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>B</div>');

    deferred.resolve('C');
    await deferred.promise;
    await new Promise((r) => setTimeout(() => r()));
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>C</div>');
  });

  test('renders a Promise to an attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test=${async(promise)}></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    await promise;
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div test="foo"></div>');
  });

  test('renders defaultContent to an attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test=${async(promise, 'bar')}></div>`, container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div test="bar"></div>');
    await promise;
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div test="foo"></div>');
  });

  test('renders a Promise to an interpolated attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test="value:${async(promise)}"></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    await promise;
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div test="value:foo"></div>');
  });

  test('renders defaultContent to an interpolated attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test="value:${async(promise, 'bar')}"></div>`, container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div test="value:bar"></div>');
    await promise;
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div test="value:foo"></div>');
  });

  test('renders a Promise to a property', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div .test=${async(promise)}></div>`, container);
    const div = container.querySelector('div');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    assert.equal((div as any).test, undefined);
    await promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    assert.equal((div as any).test, 'foo');
  });

  test('renders a Promise to a boolean attribute', async () => {
    const promise = Promise.resolve(true);
    render(html`<div ?test=${async(promise)}></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    await promise;
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div test=""></div>');
  });

  test('renders a Promise to an event binding', async () => {
    let called = false;
    const promise = Promise.resolve(() => {
      called = true;
    });
    render(html`<div @test=${async(promise)}></div>`, container);
    const div = container.querySelector('div')!;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    div.dispatchEvent(new CustomEvent('test'));
    assert.isFalse(called);
    await promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    div.dispatchEvent(new CustomEvent('test'));
    assert.isTrue(called);
  });

  test('renders new Promise over existing Promise', async () => {
    const t = (v: any) =>
        html`<div>${async(v, html`<span>loading...</span>`)}</div>`;
    render(t(deferred.promise), container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div><span>loading...</span></div>');

    const deferred2 = new Deferred<string>();
    render(t(deferred2.promise), container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div><span>loading...</span></div>');

    deferred2.resolve('bar');
    await deferred2.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');

    deferred.resolve('foo');
    await deferred.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
  });

  test('renders racing Promises correctly', async () => {
    let resolve1: (v: any) => void;
    const promise1 = new Promise((res, _) => {
      resolve1 = res;
    });
    let resolve2: (v: any) => void;
    const promise2 = new Promise((res, _) => {
      resolve2 = res;
    });

    let promise = promise1;

    const t = () => html`<div>${async(promise)}</div>`;

    // First render, first Promise, no value
    render(t(), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    promise = promise2;
    // Second render, second Promise, still no value
    render(t(), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Resolve the first Promise, should not update the container
    resolve1!('foo');
    await promise1;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    // Resolve the second Promise, should update the container
    resolve2!('bar');
    await promise2;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
  });

  // This test is aspirational
  test.skip('renders racing primary and defaultContent Promises', async () => {
    let resolve1: (v: any) => void;
    const promise1 = new Promise((res, _) => {
      resolve1 = res;
    });
    let resolve2: (v: any) => void;
    const promise2 = new Promise((res, _) => {
      resolve2 = res;
    });

    const t = () => html`<div>${async(promise1, async(promise2))}</div>`;

    // First render with neither Promise resolved
    render(t(), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Resolve the primary Promise, updates the DOM
    resolve1!('foo');
    await promise1;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    // Resolve the defaultContent Promise, should not update the container
    resolve2!('bar');
    await promise2;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });
});
