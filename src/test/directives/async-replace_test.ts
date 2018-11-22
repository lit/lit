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

import {asyncReplace} from '../../directives/async-replace.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {TestAsyncIterable} from '../lib/test-async-iterable.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

// Set Symbol.asyncIterator on browsers without it
if (typeof Symbol !== undefined && Symbol.asyncIterator === undefined) {
  Object.defineProperty(Symbol, 'Symbol.asyncIterator', {value: Symbol()});
}

suite('asyncReplace', () => {
  let container: HTMLDivElement;
  let iterable: TestAsyncIterable<string>;

  setup(() => {
    container = document.createElement('div');
    iterable = new TestAsyncIterable<string>();
  });

  test('replaces content as the async iterable yields new values', async () => {
    render(html`<div>${asyncReplace(iterable)}</div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await iterable.push('foo');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    await iterable.push('bar');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
  });

  test('clears the Part when a value is undefined', async () => {
    render(html`<div>${asyncReplace(iterable)}</div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await iterable.push('foo');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    await iterable.push(undefined);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
  });

  test('uses the mapper function', async () => {
    render(
        html`<div>${asyncReplace(iterable, (v, i) => html`${i}: ${v} `)}</div>`,
        container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await iterable.push('foo');
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div>0: foo </div>');

    await iterable.push('bar');
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div>1: bar </div>');
  });

  test('renders new iterable over a pending iterable', async () => {
    const t = (iterable: any) => html`<div>${asyncReplace(iterable)}</div>`;
    render(t(iterable), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await iterable.push('foo');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    const iterable2 = new TestAsyncIterable<string>();
    render(t(iterable2), container);

    // The last value is preserved until we receive the first
    // value from the new iterable
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    await iterable2.push('hello');
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div>hello</div>');

    await iterable.push('bar');
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div>hello</div>');
  });

  test(
      'renders the same iterable even when the iterable new value is emitted at the same time as a re-render',
      async () => {
        const t = (iterable: any) => html`<div>${asyncReplace(iterable)}</div>`;
        let wait: Promise<void>;
        render(t(iterable), container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML), '<div></div>');

        wait = iterable.push('hello');
        render(t(iterable), container);
        await wait;
        assert.equal(
            stripExpressionMarkers(container.innerHTML), '<div>hello</div>');

        wait = iterable.push('bar');
        render(t(iterable), container);
        await wait;
        assert.equal(
            stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
      });

  test('renders new value over a pending iterable', async () => {
    const t = (v: any) => html`<div>${v}</div>`;
    // This is a little bit of an odd usage of directives as values, but it
    // is possible, and we check here that asyncReplace plays nice in this case
    render(t(asyncReplace(iterable)), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await iterable.push('foo');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    render(t('hello'), container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div>hello</div>');

    await iterable.push('bar');
    assert.equal(
        stripExpressionMarkers(container.innerHTML), '<div>hello</div>');
  });

  test('does not render the first value if it is replaced first', async () => {
    async function* generator(delay: Promise<any>, value: any) {
      await delay;
      yield value;
    }

    const component = (value: any) => html`<p>${asyncReplace(value)}</p>`;
    const delay = (delay: number) =>
        new Promise((res) => setTimeout(res, delay));

    render(component(generator(delay(20), 'slow')), container);
    render(component(generator(delay(10), 'fast')), container);
    await delay(30);

    assert.equal(stripExpressionMarkers(container.innerHTML), '<p>fast</p>');
  });
});
