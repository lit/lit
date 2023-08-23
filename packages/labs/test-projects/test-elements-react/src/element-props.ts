/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as React from 'react';
import {createComponent, EventName} from '@lit-labs/react';

import {ElementProps as ElementPropsElement} from '@lit-internal/test-element-a/element-props.js';

export const ElementProps = createComponent({
  react: React,
  tagName: 'element-props',
  elementClass: ElementPropsElement,
  events: {
    onAChanged: 'a-changed' as EventName<CustomEvent<unknown>>,
  },
});
