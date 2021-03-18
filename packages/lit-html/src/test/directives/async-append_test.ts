/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {asyncAppend} from '../../directives/async-append.js';
import {render, html} from '../../lit-html.js';
import {TestAsyncIterable} from './test-async-iterable.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';
import {assert} from '@esm-bundle/chai';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Set Symbol.asyncIterator on browsers without it
if (typeof Symbol !== undefined && Symbol.asyncIterator === undefined) {
  Object.defineProperty(Symbol, 'Symbol.asyncIterator', {value: Symbol()});
}

suite('asyncAppend', () => {
  let container: HTMLDivElement;
  let iterable: TestAsyncIterable<string>;

  setup(() => {
    container = document.createElement('div');
    iterable = new TestAsyncIterable<string>();
  });

  test('appends content as the async iterable yields new values', async () => {
    render(html`<div>${asyncAppend(iterable)}</div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await iterable.push('foo');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    await iterable.push('bar');
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>foobar</div>'
    );
  });

  test('appends nothing with a value is undefined', async () => {
    render(html`<div>${asyncAppend(iterable)}</div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await iterable.push('foo');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    await iterable.push((undefined as unknown) as string);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('uses a mapper function', async () => {
    render(
      html`<div>${asyncAppend(iterable, (v, i) => html`${i}: ${v} `)}</div>`,
      container
    );
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await iterable.push('foo');
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>0: foo </div>'
    );

    await iterable.push('bar');
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>0: foo 1: bar </div>'
    );
  });

  test('renders new iterable over a pending iterable', async () => {
    const t = (iterable: any) => html`<div>${asyncAppend(iterable)}</div>`;
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
      stripExpressionMarkers(container.innerHTML),
      '<div>hello</div>'
    );

    await iterable.push('bar');
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>hello</div>'
    );
  });

  test('renders new value over a pending iterable', async () => {
    const t = (v: any) => html`<div>${v}</div>`;
    // This is a little bit of an odd usage of directives as values, but it
    // is possible, and we check here that asyncAppend plays nice in this case
    render(t(asyncAppend(iterable)), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await iterable.push('foo');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    render(t('hello'), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>hello</div>'
    );

    await iterable.push('bar');
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>hello</div>'
    );
  });

  test('does not render the first value if it is replaced first', async () => {
    const iterable2 = new TestAsyncIterable<string>();

    const component = (value: any) => html`<p>${asyncAppend(value)}</p>`;

    render(component(iterable), container);
    render(component(iterable2), container);

    await iterable2.push('fast');

    // This write should not render, since the whole iterator was replaced
    await iterable.push('slow');

    assert.equal(stripExpressionMarkers(container.innerHTML), '<p>fast</p>');
  });

  test('does not render while disconnected', async () => {
    const component = (value: any) => html`<p>${asyncAppend(value)}</p>`;
    const part = render(component(iterable), container);
    await iterable.push('1');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<p>1</p>');
    part.setConnected(false);
    await iterable.push('2');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<p>1</p>');
    part.setConnected(true);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    assert.equal(stripExpressionMarkers(container.innerHTML), '<p>12</p>');
    await iterable.push('3');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<p>123</p>');
  });
});
