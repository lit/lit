/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {createApp, reactive, h, nextTick} from 'vue';
import {
  default as ElementProps,
  Props as PropsType,
} from '@lit-internal/test-element-a-vue/ElementProps.js';
import {ElementProps as ElementPropsElement} from '@lit-internal/test-element-a/element-props.js';

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

  test('renders property changes correctly', async () => {
    const {aStr, aNum, aBool, aMyType} = document.createElement(
      'element-props'
    ) as ElementPropsElement;
    const defaults = {aStr, aNum, aBool, aMyType};

    const props: PropsType = {
      aStr: 'Hi',
      aBool: true,
      aMyType: {
        a: 'a',
        b: 2,
        c: false,
        d: ['1'],
        e: 'unknown',
        strOrNum: 5,
      },
    };

    const reactiveProps = reactive(props);
    createApp({
      render() {
        return h(ElementProps, reactiveProps);
      },
    }).mount(container);
    const el = container.querySelector('element-props')! as ElementPropsElement;
    await el.updateComplete;
    const shadowRoot = el.shadowRoot!;
    // Check that property values are rendered to DOM as expected.
    // Note, element under test has nodes with id's same as props to facilitate
    // this easily.
    const assertPropsRendered = async (values = reactiveProps) => {
      await nextTick();
      Object.entries(values).forEach(([k, v]) => {
        const e = shadowRoot.getElementById(k as string)!;
        assert.equal(
          e.textContent,
          typeof v === 'object' ? JSON.stringify(v) : String(v)
        );
      });
    };
    await assertPropsRendered();
    // Verify default values are applied when props become undefined.
    // This follows Vue's convention for handling properties.
    reactiveProps.aStr = undefined;
    reactiveProps.aNum = undefined;
    reactiveProps.aBool = undefined;
    reactiveProps.aMyType = undefined;
    await assertPropsRendered(defaults);
    // Can update props from undefined state ok.
    reactiveProps.aStr = 'n';
    reactiveProps.aNum = 100;
    reactiveProps.aBool = false;
    reactiveProps.aMyType = {
      a: 'a2',
      b: 4,
      c: true,
      d: ['1', '2', '3'],
      e: 'unknown2',
      strOrNum: '55',
    };
    await assertPropsRendered();
  });
});
