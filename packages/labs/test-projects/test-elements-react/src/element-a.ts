/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as React from 'react';
import {createComponent, EventName} from '@lit/react';

import {ElementA as ElementAElement} from '@lit-internal/test-element-a/element-a.js';

/**
 * React component that wraps <element-a>
 * See https://github.com/lit/lit/blob/main/packages/labs/test-projects/test-element-a/src/element-a.ts
 *
 * @param props.foo foo string
 * @param props.onAChanged handler for `a-changed` event
 */
export const ElementA = createComponent({
  react: React,
  tagName: 'element-a',
  elementClass: ElementAElement,
  events: {
    onAChanged: 'a-changed' as EventName<CustomEvent<unknown>>,
  },
});
