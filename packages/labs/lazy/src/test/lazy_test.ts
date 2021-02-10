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

import {TestLazyElement} from './test-lazy-element.js';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!TestLazyElement.enableWarning;

if (DEV_MODE) {
  TestLazyElement.disableWarning?.('change-in-update');
}

suite('Lazy', () => {
  let container: HTMLElement;
  let el: TestLazyElement;

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    el = new TestLazyElement();
    container.appendChild(el);
    await el.updateComplete;
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('initial status', async () => {
    assert.equal(el.div1.textContent, 'initial');
  });

  test('bootstraps on event', async () => {
    el.div1.dispatchEvent(new Event('click'));
    await el.updateComplete;
    assert.isTrue(el.lazyController!.isConnected);
    assert.equal(el.div1.textContent, 'div1:click');
  });
});
