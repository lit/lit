/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This file will be loaded by Node from the node:test script to verify that
// wrapped components can be server rendered by React without throwing.

import {createComponent} from '@lit/react';
import {ReactiveElement} from '@lit/reactive-element';
import {customElement} from '@lit/reactive-element/decorators.js';
import React from 'react';
// eslint-disable-next-line import/extensions
import {renderToString} from 'react-dom/server';

@customElement('my-element')
class MyElement extends ReactiveElement {}

const Component = createComponent({
  react: React,
  tagName: 'my-element',
  elementClass: MyElement,
});

renderToString(React.createElement(Component));
