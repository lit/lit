/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';

import React from 'react';
// eslint-disable-next-line import/extensions
import {render, unmountComponentAtNode} from 'react-dom';
import {ElementProps} from '@lit-internal/test-element-props-react/element-props.js';
import {ElementProps as ElementPropsElement} from '@lit-internal/test-element-props/element-props.js';

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
    const foo = 'Hello World';
    render(
      <React.StrictMode>
        <ElementProps foo={foo}></ElementProps>
      </React.StrictMode>,
      container
    );
    const el = container.querySelector('element-props')! as ElementPropsElement;
    await el.updateComplete;
    const {firstElementChild} = el.shadowRoot!;
    assert.equal(firstElementChild?.localName, 'h1');
    assert.equal(firstElementChild?.textContent, foo);
  });
});
