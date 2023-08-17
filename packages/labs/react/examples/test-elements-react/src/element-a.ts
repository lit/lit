/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as React from 'react';
import {createComponent, EventName} from '@lit-labs/react';

import {ElementA as ElementAElement} from '@lit-internal/test-element-a/element-a.js';

export const ElementA = createComponent({
  react: React,
  tagName: 'element-a',
  elementClass: ElementAElement,
  events: {
    onAChanged: 'a-changed' as EventName<CustomEvent<unknown>>,
  },
});
