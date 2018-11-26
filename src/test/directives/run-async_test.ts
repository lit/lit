/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

import {InitialStateError, runAsync} from '../../directives/run-async.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

suite('runAsync', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  const renderTest =
      (key: string,
       f: (s: string, options: {signal?: AbortSignal}) => Promise<string>) =>
          render(
              html`${runAsync(key, f, {
                success: (s) => html`Success: ${s}`,
                pending: () => 'Pending',
                initial: () => `Initial`,
                failure: (e: Error) => `Error: ${e.message}`
              })}`,
              container);

  test('renders pending then success templates', async () => {
    renderTest('test', async (s: string) => s);
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');
    await 0;
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Success: test');
  });

  test('renders pending then initial templates', async () => {
    renderTest('test', async (_: string) => {
      throw new InitialStateError();
    });
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');
    await 0;
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Initial');
  });

  test('renders pending then error templates', async () => {
    renderTest('test', async (s: string) => {
      throw new Error(s);
    });
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');
    await 0;
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Error: test');
  });

  test('fires pending-state with a resolving Promise on success', async () => {
    let resolve: () => void;
    let pendingPromise: Promise<any>;
    container.addEventListener('pending-state', (e: Event) => {
      pendingPromise = (e as CustomEvent).detail.promise;
    });
    renderTest('test', (s: string) => new Promise((r) => resolve = () => r(s)));
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');
    await 0;
    assert.isDefined(pendingPromise!);
    resolve!();
    // The pending Promise will resolve when the task completes successfully
    await pendingPromise!;
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Success: test');
  });

  test('fires pending-state with a rejecting Promise on error', async () => {
    let reject: () => void;
    let pendingPromise: Promise<any>;
    container.addEventListener('pending-state', (e: Event) => {
      pendingPromise = (e as CustomEvent).detail.promise;
    });
    renderTest(
        'test',
        (s: string) => new Promise((_, r) => reject = () => r(new Error(s))));
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');
    await 0;
    assert.isDefined(pendingPromise!);
    reject!();
    // The pending Promise will reject when the task completes successfully
    try {
      await pendingPromise!;
      assert.fail();
    } catch (e) {
      assert.equal(stripExpressionMarkers(container.innerHTML), 'Error: test');
    }
  });

  test('fires pending-state with a rejecting Promise on abort', async () => {
    let pendingPromise: Promise<any>;
    container.addEventListener('pending-state', (e: Event) => {
      pendingPromise = (e as CustomEvent).detail.promise;
    });
    renderTest('test', () => new Promise(() => {}));
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');
    await 0;
    assert.isDefined(pendingPromise!);

    renderTest('test2', async (s: string) => s);
    // The pending Promise will reject when the task completes successfully
    try {
      await pendingPromise!;
      assert.fail();
    } catch (e) {
      assert.equal(
          stripExpressionMarkers(container.innerHTML), 'Success: test2');
    }
  });

  test('aborts tasks when key changes', async () => {
    let resolve1: () => void;
    let aborted = false;
    let resolve2: () => void;

    // Render with an initial key and a callback that accepts an AbortSignal
    renderTest('test', (s: string, {signal}) => {
      signal!.addEventListener('abort', () => {
        aborted = true;
      });
      return new Promise((r) => resolve1 = () => r(s));
    });
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');
    await 0;
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');

    // Render with a new key, which should trigger the previous AbortSignal
    renderTest(
        'test2', (s: string) => new Promise((r) => resolve2 = () => r(s)));
    assert.isTrue(aborted);

    // Content is not changed because we're now pending the 2nd key
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');
    await 0;
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');

    resolve1!();
    // Content is not changed because this result is ignored now
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');
    await 0;
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');

    resolve2!();
    // Content is updated after a microtask
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Pending');
    await 0;
    assert.equal(stripExpressionMarkers(container.innerHTML), 'Success: test2');
  });
});
