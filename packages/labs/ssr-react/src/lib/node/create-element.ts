/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import React from 'react';
import {wrapCreateElement} from './wrap-create-element.js';

/**
 * React's `createElement` function enhanced to deeply render Lit components in
 * the server. It is simply a passthrough of `React.createElement` in the
 * browser.
 */
export const createElement = wrapCreateElement(React.createElement);
