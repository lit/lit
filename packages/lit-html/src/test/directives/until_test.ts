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

import {until} from '../../directives/until.js';
import {html, render} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';
import {assert} from '@esm-bundle/chai';
import '../polyfills.js';

const laterTask = () => new Promise((resolve) => setTimeout(resolve));

suite('until directive', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('renders a literal in a NodePart', () => {
    render(html`${until('a')}`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), 'a');
  });

  test('renders a literal in an AttributePart', () => {
    render(html`<div data-attr="${until('a')}"></div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="a"></div>'
    );
  });

  test('renders literals in an interpolated AttributePart', () => {
    render(
      html`<div data-attr="other ${until('a')} ${until('b')}"></div>`,
      container
    );
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="other a b"></div>'
    );
  });

  test('renders a literal in a BooleanAttributePart', () => {
    render(html`<div ?data-attr="${until('a')}"></div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr=""></div>'
    );
  });

  test('renders a literal in a PropertyPart', () => {
    render(html`<div .someProp="${until('a')}"></div>`, container);
    assert.equal((container.querySelector('div')! as any).someProp, 'a');
  });

  test('renders a Promise in a NodePart', async () => {
    render(html`${until(Promise.resolve('a'))}`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '');

    await laterTask();
    assert.equal(stripExpressionMarkers(container.innerHTML), 'a');
  });

  test('renders a Promise in a AttributePart', async () => {
    render(
      html`<div data-attr="${until(Promise.resolve('a'))}"></div>`,
      container
    );
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await laterTask();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="a"></div>'
    );
  });

  test('renders Promises in an interpolated AttributePart', async () => {
    render(
      html`<div data-attr="other ${until(Promise.resolve('a'))} ${until(
        Promise.resolve('b')
      )}"></div>`,
      container
    );
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await laterTask();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="other a b"></div>'
    );
  });

  test('renders a Promise in a BooleanAttributePart', async () => {
    render(
      html`<div ?data-attr="${until(Promise.resolve('a'))}"></div>`,
      container
    );
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await laterTask();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr=""></div>'
    );
  });

  test('renders a Promise in a PropertyPart', async () => {
    render(
      html`<div .someProp="${until(Promise.resolve('a'))}"></div>`,
      container
    );
    assert.equal((container.querySelector('div')! as any).someProp, undefined);

    await laterTask();
    assert.equal((container.querySelector('div')! as any).someProp, 'a');
  });

  test('renders later arguments until earlier promises resolve', async () => {
    let resolvePromise: (arg: any) => void;
    const promise = new Promise((resolve, _reject) => {
      resolvePromise = resolve;
    });

    render(html`${until(promise, 'default')}`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), 'default');

    resolvePromise!('resolved value');
    await laterTask();
    assert.equal(stripExpressionMarkers(container.innerHTML), 'resolved value');
  });

  test(
    'promises later in the arguments array than the currently used value ' +
      'do not overwrite the current value when they resolve',
    async () => {
      let resolvePromiseA: (arg: any) => void;
      const promiseA = new Promise((resolve, _reject) => {
        resolvePromiseA = resolve;
      });

      let resolvePromiseB: (arg: any) => void;
      const promiseB = new Promise((resolve, _reject) => {
        resolvePromiseB = resolve;
      });

      render(html`${until(promiseA, promiseB, 'default')}`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'default');

      resolvePromiseA!('A');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), 'A');

      resolvePromiseB!('B');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), 'A');
    }
  );

  test(
    'promises earlier in the arguments array than the currently used ' +
      'value overwrite the current value when they resolve',
    async () => {
      let resolvePromiseA: (arg: any) => void;
      const promiseA = new Promise((resolve, _reject) => {
        resolvePromiseA = resolve;
      });

      let resolvePromiseB: (arg: any) => void;
      const promiseB = new Promise((resolve, _reject) => {
        resolvePromiseB = resolve;
      });

      render(html`${until(promiseA, promiseB, 'default')}`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'default');

      resolvePromiseB!('B');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), 'B');

      resolvePromiseA!('A');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), 'A');
    }
  );

  test(
    'promises later in the arguments array than a non-promise are never ' +
      'rendered',
    async () => {
      let resolvePromise: (arg: any) => void;
      const promise = new Promise((resolve, _reject) => {
        resolvePromise = resolve;
      });

      render(html`${until('default', promise)}`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'default');

      resolvePromise!('resolved value');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), 'default');
    }
  );
});
