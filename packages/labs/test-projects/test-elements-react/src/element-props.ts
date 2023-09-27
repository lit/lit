/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as React from 'react';
import {createComponent, EventName} from '@lit/react';

import {ElementProps as ElementPropsElement} from '@lit-internal/test-element-a/element-props.js';

/**
 * React component that wraps <element-props>
 * See https://github.com/lit/lit/blob/main/packages/labs/test-projects/test-element-a/src/element-props.ts
 *
 * @param props.aStr a string
 * @param props.aNum a number
 * @param props.aBool a boolean
 * @param props.aStrArray an array of strings
 * @param props.aMyType a complex data type
 * @param props.onAChanged handler for `a-changed` event
 */
export const ElementProps = createComponent({
  react: React,
  tagName: 'element-props',
  elementClass: ElementPropsElement,
  events: {
    onAChanged: 'a-changed' as EventName<CustomEvent<unknown>>,
  },
});
