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

import {until} from '../../directives/until.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {Deferred} from '../test-utils/deferred.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

// tslint:disable:no-any OK in test code.

suite('until', () => {
  let container: HTMLDivElement;
  let deferred: Deferred<string>;

  setup(() => {
    container = document.createElement('div');
    deferred = new Deferred<string>();
  });

  test('renders a Promise when it resolves', async () => {
    let resolve: (v: any) => void;
    const promise = new Promise((res, _) => {
      resolve = res;
    });
    render(html`<div>${until(promise)}</div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    resolve!('foo');
    await promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders non-Promises immediately', async () => {
    const defaultContent = html`<span>loading...</span>`;
    render(
        html`<div>${until(deferred.promise, defaultContent)}</div>`, container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div><span>loading...</span></div>');
    deferred.resolve('foo');
    await deferred.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders primitive low-priority content only once', async () => {
    const go = () => render(
        html`<div>${until(deferred.promise, 'loading...')}</div>`, container);

    go();
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div>loading...</div>');
    deferred.resolve('foo');
    await deferred.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    go();
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders non-primitive low-priority content only once', async () => {
    const go = () => render(
        html`<div>${until(deferred.promise, html`loading...`)}</div>`,
        container);

    go();
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div>loading...</div>');
    deferred.resolve('foo');
    await deferred.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    go();
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders changing defaultContent', async () => {
    const t = (d: any) => html`<div>${until(deferred.promise, d)}</div>`;
    render(t('A'), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>A</div>');

    render(t('B'), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>B</div>');

    deferred.resolve('C');
    await deferred.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>C</div>');
  });

  test('renders a Promise to an attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test=${until(promise)}></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    await promise;
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div test="foo"></div>');
  });

  test('renders defaultContent to an attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test=${until(promise, 'bar')}></div>`, container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div test="bar"></div>');
    await promise;
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div test="foo"></div>');
  });

  test('renders a Promise to an interpolated attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test="value:${until(promise)}"></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    await promise;
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div test="value:foo"></div>');
  });

  test('renders defaultContent to an interpolated attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test="value:${until(promise, 'bar')}"></div>`, container);
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
    render(html`<div .test=${until(promise)}></div>`, container);
    const div = container.querySelector('div');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    assert.equal((div as any).test, undefined);
    await promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    assert.equal((div as any).test, 'foo');
  });

  test('renders a Promise to a boolean attribute', async () => {
    const promise = Promise.resolve(true);
    render(html`<div ?test=${until(promise)}></div>`, container);
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
    render(html`<div @test=${until(promise)}></div>`, container);
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
        html`<div>${until(v, html`<span>loading...</span>`)}</div>`;
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

  test('renders racing Promises across renders correctly', async () => {
    let resolve1: (v: any) => void;
    const promise1 = new Promise((res, _) => {
      resolve1 = res;
    });
    let resolve2: (v: any) => void;
    const promise2 = new Promise((res, _) => {
      resolve2 = res;
    });

    const t = (promise: any) => html`<div>${until(promise)}</div>`;

    // First render, first Promise, no value
    render(t(promise1), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Second render, second Promise, still no value
    render(t(promise2), container);
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

  test('renders Promises resolving in high-to-low priority', async () => {
    let resolve1: (v: any) => void;
    const promise1 = new Promise((res, _) => {
      resolve1 = res;
    });
    let resolve2: (v: any) => void;
    const promise2 = new Promise((res, _) => {
      resolve2 = res;
    });

    const t = () => html`<div>${until(promise1, promise2)}</div>`;

    // First render with neither Promise resolved
    render(t(), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Resolve the primary Promise, updates the DOM
    resolve1!('foo');
    await promise1;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    // Resolve the secondary Promise, should not update the container
    resolve2!('bar');
    await promise2;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders Promises resolving in low-to-high priority', async () => {
    let resolve1: (v: any) => void;
    const promise1 = new Promise((res, _) => {
      resolve1 = res;
    });
    let resolve2: (v: any) => void;
    const promise2 = new Promise((res, _) => {
      resolve2 = res;
    });

    const t = () => html`<div>${until(promise1, promise2)}</div>`;

    // First render with neither Promise resolved
    render(t(), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Resolve the secondary Promise, updates the DOM
    resolve2!('bar');
    await promise2;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');

    // Resolve the primary Promise, updates the DOM
    resolve1!('foo');
    await promise1;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders Promises with changing priorities', async () => {
    const promise1 = Promise.resolve('foo');
    const promise2 = Promise.resolve('bar');

    const t = (p1: any, p2: any) => html`<div>${until(p1, p2)}</div>`;

    render(t(promise1, promise2), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    // Await a microtask to let both Promise then callbacks go
    await 0;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    render(t(promise2, promise1), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
    await 0;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
  });

  test('renders low-priority content when arguments change', async () => {
    let resolve1: (v: any) => void;
    const promise1 = new Promise((res, _) => {
      resolve1 = res;
    });
    const promise2 = Promise.resolve('bar');

    const t = (p1: any, p2: any) => html`<div>${until(p1, p2)}</div>`;

    // First render a high-priority value
    render(t('string', promise2), container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div>string</div>');
    // Await a microtask to let both Promise then callbacks go
    await 0;
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div>string</div>');

    // Then render new Promises with the low-priority Promise already resolved
    render(t(promise1, promise2), container);
    // Because they're Promises, nothing happens synchronously
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div>string</div>');
    await 0;
    // Low-priority renders
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
    resolve1!('foo');
    await promise1;
    // High-priority renders
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders Promises resolving after changing priority', async () => {
    let resolve1: (v: any) => void;
    const promise1 = new Promise((res, _) => {
      resolve1 = res;
    });
    let resolve2: (v: any) => void;
    const promise2 = new Promise((res, _) => {
      resolve2 = res;
    });

    const t = (p1: any, p2: any) => html`<div>${until(p1, p2)}</div>`;

    // First render with neither Promise resolved
    render(t(promise1, promise2), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Change priorities
    render(t(promise2, promise1), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Resolve the primary Promise, updates the DOM
    resolve1!('foo');
    await promise1;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    // Resolve the secondary Promise, also updates the DOM
    resolve2!('bar');
    await promise2;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
  });
});
