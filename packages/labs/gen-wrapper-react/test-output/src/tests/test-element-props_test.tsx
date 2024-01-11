/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';

import React from 'react';
// eslint-disable-next-line import/extensions
import {render, unmountComponentAtNode} from 'react-dom';
import {ElementProps} from '@lit-internal/test-element-a-react/element-props.js';
import {ElementProps as ElementPropsElement} from '@lit-internal/test-element-a/element-props.js';

suite('test-element-props', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      unmountComponentAtNode(container);
      container.parentNode.removeChild(container);
    }
  });

  test('renders correctly', async () => {
    const props = {
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
    render(
      <React.StrictMode>
        <ElementProps {...props}></ElementProps>
      </React.StrictMode>,
      container
    );
    const el = container.querySelector('element-props')! as ElementPropsElement;
    await el.updateComplete;
    const shadowRoot = el.shadowRoot!;
    Object.entries(props).forEach(([k, v]) => {
      const e = shadowRoot.getElementById(k as string)!;
      assert.equal(el[k as keyof ElementPropsElement], v);
      assert.equal(
        e.textContent,
        typeof v === 'object' ? JSON.stringify(v) : String(v)
      );
    });
  });
});
