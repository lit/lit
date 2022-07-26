/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {createApp} from 'vue';
import ElementProps from '@lit-internal/test-element-props-vue/ElementProps.js';
import {ElementProps as ElementPropsElement} from '@lit-internal/test-element-props/element-props.js';

suite('test-element-props', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('renders correctly', async () => {
    const props = {
      optAStr: 'optAStr',
      optANum: 10,
      optAStrOrNum: 'optAStrOrNum',
      optABool: true,
      aStr: 'aStr',
      aNum: 11,
      aStrOrNum: 'aStrOrNum',
      aBool: true,
      aStrArray: ['11', '22'],
      aMyType: {
        a: 'aa',
        b: 22,
        c: false,
        d: ['a', 'b', 'c'],
        e: null,
        strOrNum: 'strOrNum',
      },
    };

    createApp(ElementProps, props).mount(container);
    const el = container.querySelector('element-props')! as ElementPropsElement;
    await el.updateComplete;
    const {shadowRoot} = el;
    const {firstElementChild} = shadowRoot!;
    assert.equal(firstElementChild?.localName, 'h1');
    assert.equal(firstElementChild?.textContent, 'Props');
    Object.entries(props).forEach(([prop, value]) => {
      assert.equal(
        shadowRoot!.getElementById(prop)!.textContent,
        typeof value === 'object' ? JSON.stringify(value) : String(value),
        `fail on ${prop}`
      );
    });
  });
});
