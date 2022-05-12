/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';

import React from 'react';
// eslint-disable-next-line import/extensions
import ReactDOM from 'react-dom/client';
import {ElementA} from '@lit-internal/test-element-a-react/element-a.js';
import {ElementA as ElementAElement} from '@lit-internal/test-element-a/element-a.js';

suite('test-element-a', () => {
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
    const root = ReactDOM.createRoot(container);
    const foo = 'Hello World';
    root.render(
      <React.StrictMode>
        <ElementA foo={foo}></ElementA>
      </React.StrictMode>
    );
    await new Promise((r) => setTimeout(r));
    const el = container.querySelector('element-a')! as ElementAElement;
    await el.updateComplete;
    const {firstElementChild} = el.shadowRoot!;
    assert.equal(firstElementChild?.localName, 'h1');
    assert.equal(firstElementChild?.textContent, foo);
  });
});
