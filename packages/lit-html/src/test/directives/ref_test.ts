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
import {ref, Ref} from '../../directives/ref.js';
import {assert} from '@esm-bundle/chai';

suite('ref', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('sets a ref', () => {
    const divRef = new Ref();
    render(html`<div ${ref(divRef)}></div>`, container);
    const div = container.firstElementChild;
    assert.equal(divRef.value, div);
  });

  test.only('two refs', () => {
    const divRef1 = new Ref();
    const divRef2 = new Ref();
    render(html`<div ${ref(divRef1)} ${ref(divRef2)}></div>`, container);
    const div = container.firstElementChild;
    assert.equal(divRef1.value, div);
    assert.equal(divRef2.value, div);
  });
});
