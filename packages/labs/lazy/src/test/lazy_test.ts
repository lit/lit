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

import {LazyElement, html} from '../lazy-element.js';
import {property} from 'lit-element/decorators/property.js';
import {customElement} from 'lit-element/decorators/custom-element.js';
import {generateElementName} from './test-helpers';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!LazyElement.enableWarning;

if (DEV_MODE) {
  LazyElement.disableWarning?.('change-in-update');
}

suite('Lazy', () => {
  let container: HTMLElement;
  let el: A;

  @customElement(generateElementName())
  class A extends LazyElement {
    @property() foo = 'hi';

    render() {
      return html`${this.foo}`;
    }
  }

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    el = new A();
    container.appendChild(el);
    await el.updateComplete;
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('initial status', async () => {
    el = new A();
    assert.instanceOf(el, LazyElement);
  });
});
